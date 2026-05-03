import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Minimal birthday invitation' })
  @MaxLength(100, { message: 'title must be at most 100 characters' })
  @IsString()
  @IsNotEmpty({ message: 'title cannot be empty' })
  @SanitizeString('any')
  readonly title!: string;

  @ApiProperty({ example: 'http://localhost:3000/files/templates/template.json' })
  @MaxLength(500, { message: 'file must be at most 500 characters' })
  @IsString()
  @IsNotEmpty({ message: 'file cannot be empty' })
  @SanitizeString('any')
  readonly file!: string;

  @ApiProperty({ example: 'instagram-post' })
  @MaxLength(50, { message: 'type must be at most 50 characters' })
  @IsString()
  @IsNotEmpty({ message: 'type cannot be empty' })
  @SanitizeString('lower')
  readonly type!: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'isBuiltIn must be a boolean value' })
  readonly isBuiltIn?: boolean;
}
