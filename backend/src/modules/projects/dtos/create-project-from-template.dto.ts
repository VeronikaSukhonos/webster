import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';

export class CreateProjectFromTemplateDto {
  @ApiProperty({ example: 'Project from Instagram template' })
  @MaxLength(100, { message: 'title must be at most 100 characters' })
  @IsString()
  @IsNotEmpty({ message: 'title cannot be empty' })
  @SanitizeString('any')
  readonly title!: string;

  @ApiProperty({
    required: false,
    example: 'Draft design based on a template',
  })
  @IsOptional()
  @MaxLength(300, { message: 'description must be at most 300 characters' })
  @SanitizeString('any')
  readonly description?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'isPublic must be a boolean value' })
  readonly isPublic?: boolean;
}
