import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSocialAccount } from './social-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSocialAccount])],
  exports: [TypeOrmModule],
})
export class SocialAccountsModule {}
