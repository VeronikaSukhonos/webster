import { Expose } from 'class-transformer';

export class ImageResponseDto {
  @Expose()
  readonly id!: string;

  @Expose()
  readonly url!: string;
}
