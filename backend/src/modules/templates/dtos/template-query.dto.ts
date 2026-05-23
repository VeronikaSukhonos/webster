import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';
import { PaginationQueryDto } from '../../../common/dtos';
import {
  TEMPLATE_TYPE_ENUM,
  TEMPLATE_TYPE_EXAMPLE,
  TEMPLATE_TYPE_VALIDATION_MESSAGE,
  type TemplateType,
} from '../template-type.enum';

export class TemplateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TEMPLATE_TYPE_ENUM, example: TEMPLATE_TYPE_EXAMPLE })
  @IsOptional()
  @IsIn(TEMPLATE_TYPE_ENUM, {
    message: TEMPLATE_TYPE_VALIDATION_MESSAGE,
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
