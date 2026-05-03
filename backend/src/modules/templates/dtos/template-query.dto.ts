import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';
import { PaginationQueryDto } from '../../../common/dtos';

export class TemplateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'instagram-post' })
  @IsOptional()
  @IsString()
  @SanitizeString('lower')
  readonly type?: string;

  @ApiPropertyOptional({ enum: ['all', 'built-in', 'custom'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'built-in', 'custom'], {
    message: 'source must be one of the following values: all, built-in, custom',
  })
  readonly source: 'all' | 'built-in' | 'custom' = 'all';
}
