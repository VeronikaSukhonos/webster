import { Expose, Type } from 'class-transformer';
import { UserProfileResponseDto } from '../../users/dtos';

class ProjectTemplateResponseDto {
  @Expose()
  readonly id!: number;

  @Expose()
  readonly title!: string;

  @Expose()
  readonly type!: string;
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
  readonly isPublic!: boolean;

  @Expose()
  readonly createDate!: Date;

  @Expose()
  readonly editDate!: Date;

  @Expose()
  readonly templateId!: number | null;

  @Expose()
  @Type(() => UserProfileResponseDto)
  readonly author?: UserProfileResponseDto;

  @Expose()
  @Type(() => ProjectTemplateResponseDto)
  readonly template?: ProjectTemplateResponseDto | null;
}
