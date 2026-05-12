import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
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
import { SanitizeString } from '../../../common/decorators';
import type { JsonDocument } from '../../../common/utils';
import { TemplateType } from '../template-type.enum';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Minimal birthday invitation' })
  @MaxLength(100, { message: 'title must be at most 100 characters' })
  @IsString()
  @IsNotEmpty({ message: 'title cannot be empty' })
  @SanitizeString('any')
  readonly title!: string;

  @ApiProperty({
    type: 'object',
    example: { version: 1, elements: [] },
    additionalProperties: true,
  })
  @IsObject({ message: 'content must be an object' })
  @IsNotEmptyObject({}, { message: 'content cannot be empty' })
  readonly content!: JsonDocument;

  @ApiProperty({ example: 'templates/preview.png' })
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

  @ApiProperty({ enum: TemplateType, example: TemplateType.InstagramPost })
  @IsEnum(TemplateType, {
    message:
      'type must be one of the following values: other, collage, instagram-post, instagram-story, invitation, presentation, resume',
  })
  @IsNotEmpty({ message: 'type cannot be empty' })
  @SanitizeString('lower')
  readonly type!: TemplateType;

  @ApiProperty({ required: false, nullable: true, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'projectId must be an integer' })
  readonly projectId?: number | null;
}
