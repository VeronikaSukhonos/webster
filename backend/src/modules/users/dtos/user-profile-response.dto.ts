import { Expose } from 'class-transformer';

export class UserProfileResponseDto {
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
}
