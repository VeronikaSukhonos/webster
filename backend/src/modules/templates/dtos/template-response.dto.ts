import { Expose, Type } from 'class-transformer';
import { EntityAuthorResponseDto } from '../../../common/dtos';
import type { JsonDocument } from '../../../common/utils';
import type { TemplateType } from '../template-type.enum';

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
  readonly content?: JsonDocument;

  @Expose()
  readonly preview!: string;

  @Expose()
  readonly width!: number;

  @Expose()
  readonly height!: number;

  @Expose()
  readonly createDate!: Date;

  @Expose()
  readonly type!: TemplateType;

  @Expose()
  readonly isBuiltIn!: boolean;

  @Expose()
  readonly projectId!: number | null;

  @Expose()
  @Type(() => EntityAuthorResponseDto)
  readonly author!: EntityAuthorResponseDto;
}
