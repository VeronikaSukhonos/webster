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
  readonly google_id?: string;
}
