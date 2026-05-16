import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsBoolean,
  IsInt,
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SanitizeString } from '../../../common/decorators';
import { parseJsonDocumentInput, type JsonDocument } from '../../../common/utils';

function parseBooleanInput(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function parseNullableNumberInput(value: unknown): unknown {
  if (value === '' || value === 'null') return null;
  if (typeof value === 'string') return Number(value);
  return value;
}

function parseStringArrayInput(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;

  const trimmedValue = value.trim();

  if (!trimmedValue) return [];

  try {
    const parsed: unknown = JSON.parse(trimmedValue);

    if (Array.isArray(parsed)) return parsed;
  } catch {
    return [value];
  }

  return [value];
}

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
  @Transform(({ value }) => parseJsonDocumentInput(value))
  @IsObject({ message: 'content must be an object' })
  @IsNotEmptyObject({}, { message: 'content cannot be empty' })
  readonly content!: JsonDocument;

  @ApiProperty({
    required: false,
    example: 'projects/preview.png',
    description: 'Existing preview path. Multipart preview files must be sent as "preview".',
  })
  @IsOptional()
  @MaxLength(150, { message: 'previewPath must be at most 150 characters' })
  @IsString()
  @IsNotEmpty({ message: 'previewPath cannot be empty' })
  @SanitizeString('any')
  readonly previewPath?: string;

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
  @Transform(({ value }) => parseBooleanInput(value))
  @IsBoolean({ message: 'isPublic must be a boolean value' })
  readonly isPublic?: boolean;

  @ApiProperty({ required: false, nullable: true, example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseNullableNumberInput(value))
  @IsInt({ message: 'templateId must be an integer' })
  readonly templateId?: number | null;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Ids of uploaded image files in the same order as uploads',
    example: ['2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArrayInput(value))
  @IsArray({ message: 'uploadIds must be an array' })
  @ArrayUnique({ message: 'uploadIds must contain unique values' })
  @MaxLength(100, { each: true, message: 'uploadIds values must be at most 100 characters' })
  @IsString({ each: true, message: 'uploadIds values must be strings' })
  readonly uploadIds?: string[];

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Ids of image assets currently referenced by the JSON content',
    example: ['2f5c4a63-7a51-4e9f-bc9c-16e1f1f9ac32'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArrayInput(value))
  @IsArray({ message: 'imageIds must be an array' })
  @ArrayUnique({ message: 'imageIds must contain unique values' })
  @MaxLength(100, { each: true, message: 'imageIds values must be at most 100 characters' })
  @IsString({ each: true, message: 'imageIds values must be strings' })
  readonly imageIds?: string[];
}
