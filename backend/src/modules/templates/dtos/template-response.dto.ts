import { Expose, Type } from 'class-transformer';
import { EntityAuthorResponseDto } from '../../../common/dtos';

export class TemplateResponseDto {
  @Expose()
  readonly id!: number;

  @Expose()
  readonly authorId!: number;

  @Expose()
  readonly title!: string;

  @Expose()
  readonly file!: string;

  @Expose()
  readonly preview!: string;

  @Expose()
  readonly createDate!: Date;

  @Expose()
  readonly type!: string;

  @Expose()
  readonly isBuiltIn!: boolean;

  @Expose()
  @Type(() => EntityAuthorResponseDto)
  readonly author!: EntityAuthorResponseDto;
}
