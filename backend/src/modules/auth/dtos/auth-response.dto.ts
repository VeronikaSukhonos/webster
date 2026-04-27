import { Expose } from 'class-transformer';

export class AuthResponseDto {
  @Expose()
  readonly id!: number;

  @Expose()
  readonly username!: string;

  @Expose()
  readonly email!: string;

  @Expose()
  readonly avatar!: string;

  @Expose()
  readonly about!: string;

  @Expose()
  readonly registerDate!: Date;

  @Expose()
  readonly hasPassword!: boolean;

  @Expose()
  readonly googleId?: string;
}
