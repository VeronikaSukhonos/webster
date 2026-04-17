import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { TokenModule } from '../token/token.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [UsersModule, EmailModule, TokenModule],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
