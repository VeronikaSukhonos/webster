import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizeString } from '../../../common/decorators';
import type { JsonDocument } from '../../../common/utils';

export class CreateProjectDto {
  @ApiProperty({ example: 'Instagram spring sale post' })
  @MaxLength(100, { message: 'title must be at most 100 characters' })
  @IsString()
  @IsNotEmpty({ message: 'title cannot be empty' })
  @SanitizeString('any')
  readonly title!: string;

  @ApiProperty({
    required: false,
    example: 'Draft design for a social media campaign',
  })
  @IsOptional()
  @MaxLength(300, { message: 'description must be at most 300 characters' })
  @SanitizeString('any')
  readonly description?: string;

  @ApiProperty({
    type: 'object',
    example: { version: 1, elements: [] },
    additionalProperties: true,
  })
  @IsObject({ message: 'content must be an object' })
  @IsNotEmptyObject({}, { message: 'content cannot be empty' })
  readonly content!: JsonDocument;

  @ApiProperty({ example: 'projects/preview.png' })
  @MaxLength(100, { message: 'preview must be at most 100 characters' })
  @IsString()
  @IsNotEmpty({ message: 'preview cannot be empty' })
  @SanitizeString('any')
  readonly preview!: string;

  @ApiProperty({ example: 1080, minimum: 40, maximum: 4000 })
  @Type(() => Number)
  @IsInt({ message: 'width must be an integer' })
  @Min(40, { message: 'width must be at least 40 pixels' })
  @Max(4000, { message: 'width must be at most 4000 pixels' })
  readonly width!: number;

  @ApiProperty({ example: 1350, minimum: 40, maximum: 4000 })
  @Type(() => Number)
  @IsInt({ message: 'height must be an integer' })
  @Min(40, { message: 'height must be at least 40 pixels' })
  @Max(4000, { message: 'height must be at most 4000 pixels' })
  readonly height!: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'isPublic must be a boolean value' })
  readonly isPublic?: boolean;

  @ApiProperty({ required: false, nullable: true, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'templateId must be an integer' })
  readonly templateId?: number | null;
}
