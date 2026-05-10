import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';
import { PaginationQueryDto } from '../../../common/dtos';
import { TemplateType } from '../template-type.enum';

export class TemplateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TemplateType, example: TemplateType.InstagramPost })
  @IsOptional()
  @IsEnum(TemplateType, {
    message:
      'type must be one of the following values: other, collage, instagram-post, instagram-story, invitation, presentation, resume',
  })
  @SanitizeString('lower')
  readonly type?: TemplateType;

  @ApiPropertyOptional({ enum: ['all', 'built-in', 'custom'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'built-in', 'custom'], {
    message: 'source must be one of the following values: all, built-in, custom',
  })
  readonly source: 'all' | 'built-in' | 'custom' = 'all';
}
