import { Expose, Type } from 'class-transformer';
import { EntityAuthorResponseDto } from '../../../common/dtos';
import type { JsonDocument } from '../../../common/utils';

class ProjectTemplateResponseDto {
  @Expose()
  readonly id!: number;

  @Expose()
  readonly title!: string;
}

export class ProjectResponseDto {
  @Expose()
  readonly id!: number;

  @Expose()
  readonly authorId!: number;

  @Expose()
  readonly title!: string;

  @Expose()
  readonly description!: string | null;

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
  readonly isPublic!: boolean;

  @Expose()
  readonly createDate!: Date;

  @Expose()
  readonly editDate!: Date;

  @Expose()
  readonly templateId!: number | null;

  @Expose()
  @Type(() => EntityAuthorResponseDto)
  readonly author!: EntityAuthorResponseDto;

  @Expose()
  @Type(() => ProjectTemplateResponseDto)
  readonly template?: ProjectTemplateResponseDto | null;
}
