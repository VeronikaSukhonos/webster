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
import * as crypto from 'crypto';
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

  async getOneBasic(
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
        ...(sensitive && {
          password: true,
          emailToken: true,
          passwordToken: true,
          refreshToken: true,
          deletionToken: true,
          googleId: true,
        }),
      },
    });
  }

  async getOneProfile(id: number, authId: number): Promise<UserProfileResponseDto | null> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) throw new NotFoundException('User is not found');

    return plainToInstance(UserProfileResponseDto, {
      ...user,
      ...(authId === id ? { email: user.email } : { email: undefined }),
    });
  }

  async createOne(dto: CreateUserDto): Promise<User> {
    return await this.usersRepository.save(dto);
  }

  async updateOneSensitive(
    id: number,
    field:
      | { password: string | null }
      | { emailToken: string | null }
      | { passwordToken: string | null }
      | { refreshToken: string | null }
      | { deletionToken: string | null }
      | { googleId: string | null },
  ): Promise<void> {
    await this.usersRepository.update(id, field);
  }

  async updateOneProfile(
    id: number,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto | void> {
    const user = await this.usersRepository.findOneBy({ id });
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
    if (!updated) return;

    await this.usersRepository.save(user);
    return plainToInstance(UserProfileResponseDto, user);
  }

  async updateOnePassword(id: number, dto: UpdateUserPasswordDto): Promise<void> {
    const { password, currentPassword } = dto;
    const user = await this.getOneBasic({ id }, true);

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
      await uploadFileToPath(
        avatar,
        `${crypto.randomBytes(10).toString('hex')}${Date.now()}`,
        'avatars',
      ),
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
          path.join(
            'files',
            'avatars',
            'users',
            user.avatar.substring(user.avatar.lastIndexOf('/') + 1),
          ),
          { force: true },
        );
    }
    await this.usersRepository.update(user.id, { avatar: filepath });

    return filepath;
  }

  async requestAccountDeletion(id: number): Promise<void> {
    const user = await this.getOneBasic({ id }, true);

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
      const user = await this.getOneBasic({ id: payload.id }, true);

      if (!user || user.deletionToken !== token) {
        throw new BadRequestException('Invalid or expired deletion token');
      }

      await this.usersRepository.delete(user.id);
    } catch {
      throw new BadRequestException('Invalid or expired deletion token');
    }
  }
}
