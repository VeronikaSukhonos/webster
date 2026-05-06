import { Expose } from 'class-transformer';

export class EntityAuthorResponseDto {
  @Expose()
  readonly id!: number;

  @Expose()
  readonly username!: string;
}
