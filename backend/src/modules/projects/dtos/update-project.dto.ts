import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiProperty({
    required: false,
    description: 'Last known project edit date. Used to prevent overwriting newer changes.',
    example: '2026-04-28T19:17:06.813Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'editDate must be a valid ISO date string' })
  readonly editDate?: string;
}
