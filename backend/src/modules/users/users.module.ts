import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TokenModule } from '../token/token.module';
import { EmailModule } from '../email/email.module';
import { User } from './user.entity';
import { AdminSeederService } from './admin-seeder.service';
import { CloudflareR2Module } from '../cloudflare-r2/cloudflare-r2.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), TokenModule, EmailModule, CloudflareR2Module],
  providers: [UsersService, AdminSeederService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
