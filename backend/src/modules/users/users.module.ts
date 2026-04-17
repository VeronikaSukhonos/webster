import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TokenModule } from '../token/token.module';
import { EmailModule } from '../email/email.module';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), TokenModule, EmailModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
