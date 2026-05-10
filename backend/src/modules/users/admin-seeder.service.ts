import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class AdminSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const username = this.getTrimmedConfig('ADMIN_USERNAME', 'admin');
    const email = this.getTrimmedConfig('ADMIN_EMAIL', 'admin@sketcherry.local');
    const password = this.configService.get<string>('ADMIN_PASSWORD') || 'Admin12345';
    const about = this.getTrimmedConfig('ADMIN_ABOUT', 'Built-in templates owner');

    const adminByEmail = await this.usersRepository.findOne({
      where: { email },
      select: { id: true, email: true, username: true, isAdmin: true },
    });

    if (adminByEmail) {
      if (!adminByEmail.isAdmin) {
        await this.usersRepository.update(adminByEmail.id, { isAdmin: true });
        this.logger.log(`Marked existing user ${adminByEmail.email} as default admin`);
      }

      return;
    }

    const usernameOwner = await this.usersRepository.findOne({
      where: { username },
      select: { id: true, username: true },
    });

    if (usernameOwner) {
      this.logger.warn(
        `Default admin was not created because username "${username}" is already taken`,
      );

      return;
    }

    await this.usersRepository.save(
      this.usersRepository.create({
        username,
        email,
        password: await bcrypt.hash(password, 10),
        about,
        isAdmin: true,
      }),
    );
    this.logger.log(`Created default admin user ${email}`);
  }

  private getTrimmedConfig(key: string, fallback: string): string {
    return this.configService.get<string>(key)?.trim() || fallback;
  }
}
