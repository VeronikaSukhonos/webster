import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { rm } from 'fs/promises';
import path from 'path';
import { User } from './user.entity';
import { TokenService } from '../token/token.service';
import { EmailService } from '../email/email.service';
import {
  CreateUserDto,
  UpdateUserPasswordDto,
  UpdateUserProfileDto,
  UserProfileResponseDto,
} from './dtos';
import { AuthResponseDto } from '../auth/dtos';
import { uploadFileToPath } from '../../common/utils';
import { DEFAULT_USER_AVATAR, FILEPATH_PREFIX } from '../../common/constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private tokenService: TokenService,
    private emailService: EmailService,
  ) {}

  async getOne(
    where: { username: string } | { email: string } | { id: number },
    sensitive: boolean = false,
  ): Promise<User | null> {
    return await this.usersRepository.findOne({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        about: true,
        isAdmin: true,
        registerDate: true,
        ...(sensitive && {
          password: true,
          googleId: true,
          emailToken: true,
          passwordToken: true,
          refreshToken: true,
          deletionToken: true,
        }),
      },
    });
  }

  async getOneProfile(id: number, authId: number): Promise<UserProfileResponseDto | null> {
    const user = await this.getOne({ id }, authId === id);

    if (!user) throw new NotFoundException('User is not found');

    return plainToInstance(authId === id ? AuthResponseDto : UserProfileResponseDto, {
      ...user,
      hasPassword: user.password ? true : false,
    });
  }

  async createOne(dto: CreateUserDto): Promise<User> {
    return await this.usersRepository.save(dto);
  }

  async updateOneSensitive(
    id: number,
    field:
      | { password: string | null }
      | { googleId: string | null }
      | { emailToken: string | null }
      | { passwordToken: string | null }
      | { refreshToken: string | null }
      | { deletionToken: string | null },
  ): Promise<void> {
    await this.usersRepository.update(id, field);
  }

  async updateOneProfile(
    id: number,
    dto: UpdateUserProfileDto,
  ): Promise<{ user: UserProfileResponseDto; updated: boolean }> {
    const user = await this.getOne({ id }, true);
    let updated = false;

    if (!user) throw new NotFoundException('User is not found');

    if (dto.username !== undefined && dto.username !== user.username) {
      if (await this.usersRepository.findOne({ where: { username: dto.username, id: Not(id) } })) {
        throw new ConflictException({
          message: 'Unavailable value(s)',
          errors: [{ param: 'username', error: 'unavailable username' }],
        });
      }
      user.username = dto.username;
      updated = true;
    }
    if (dto.about !== undefined && dto.about !== user.about) {
      user.about = dto.about;
      updated = true;
    }
    if (updated) await this.usersRepository.save(user);

    return {
      user: plainToInstance(AuthResponseDto, {
        ...user,
        hasPassword: user.password ? true : false,
      }),
      updated,
    };
  }

  async updateOnePassword(id: number, dto: UpdateUserPasswordDto): Promise<void> {
    const { password, currentPassword } = dto;
    const user = await this.getOne({ id }, true);

    if (!user) throw new NotFoundException('User is not found');

    if (!user.googleId) {
      if (!currentPassword) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{ param: 'currentPassword', error: 'current password is required' }],
        });
      }
      if (!(await bcrypt.compare(currentPassword, user.password ?? '')))
        throw new ForbiddenException('Invalid current password');
    }

    await this.usersRepository.update(id, { password: await bcrypt.hash(password, 10) });
  }

  async uploadOneAvatar(id: number, avatar: Express.Multer.File): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: { id: true, avatar: true },
    });

    if (!user) throw new NotFoundException('User is not found');

    return await this.deleteOneAvatarAndSave(
      user,
      await uploadFileToPath(avatar, 'avatars', `avatar-${user.id}`),
    );
  }

  async deleteOneAvatar(id: number): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: { id: true, avatar: true },
    });

    if (!user) throw new NotFoundException('User is not found');

    return await this.deleteOneAvatarAndSave(user);
  }

  async deleteOneAvatarAndSave(
    user: User,
    filepath: string = DEFAULT_USER_AVATAR,
  ): Promise<string> {
    if (user.avatar.startsWith(FILEPATH_PREFIX)) {
      if (user.avatar !== DEFAULT_USER_AVATAR)
        await rm(
          path.join('files', 'avatars', user.avatar.substring(user.avatar.lastIndexOf('/') + 1)),
          { force: true },
        );
    }
    await this.usersRepository.update(user.id, { avatar: filepath });

    return filepath;
  }

  async requestAccountDeletion(id: number): Promise<void> {
    const user = await this.getOne({ id });

    if (!user) throw new NotFoundException('User is not found');

    const deletionToken = await this.tokenService.createToken(
      { id: user.id, email: user.email },
      'CONFIRM',
    );

    await this.updateOneSensitive(user.id, { deletionToken });
    await this.emailService.sendAccountDeletion(
      { email: user.email, name: user.username },
      deletionToken,
    );
  }

  async deleteOne(token: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyToken(token, 'CONFIRM');
      const user = await this.getOne({ id: payload.id }, true);

      if (!user || user.deletionToken !== token)
        throw new BadRequestException('Invalid or expired deletion token');

      await this.usersRepository.delete(user.id);
    } catch {
      throw new BadRequestException('Invalid or expired deletion token');
    }
  }
}
