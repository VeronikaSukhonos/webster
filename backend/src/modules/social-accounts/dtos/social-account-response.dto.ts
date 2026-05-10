import { Expose } from 'class-transformer';
import { SocialProvider } from '../social-account.entity';

export class SocialAccountResponseDto {
  @Expose()
  readonly id!: number;

  @Expose()
  readonly userId!: number;

  @Expose()
  readonly provider!: SocialProvider;

  @Expose()
  readonly providerAccountId!: string;

  @Expose()
  readonly username!: string | null;

  @Expose()
  readonly displayName!: string | null;

  @Expose()
  readonly avatar!: string | null;

  @Expose()
  readonly tokenExpiresAt!: Date | null;

  @Expose()
  readonly scopes!: string | null;
}
