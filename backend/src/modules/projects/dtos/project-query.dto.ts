import { PaginationQueryDto } from '../../../common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'authorId must be an integer' })
  @Min(1, { message: 'authorId must be at least 1' })
  readonly authorId?: number;
}
