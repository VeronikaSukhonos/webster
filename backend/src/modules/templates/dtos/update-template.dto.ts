import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';
import {
  TEMPLATE_TYPE_ENUM,
  TEMPLATE_TYPE_EXAMPLE,
  TEMPLATE_TYPE_VALIDATION_MESSAGE,
  type TemplateType,
} from '../template-type.enum';

export class UpdateTemplateDto {
  @ApiProperty({ required: false, example: 'Updated invitation template' })
  @IsOptional()
  @MaxLength(100, { message: 'title must be at most 100 characters' })
  @IsString()
  @IsNotEmpty({ message: 'title cannot be empty' })
  @SanitizeString('any')
  readonly title?: string;

  @ApiProperty({ required: false, enum: TEMPLATE_TYPE_ENUM, example: TEMPLATE_TYPE_EXAMPLE })
  @IsOptional()
  @IsIn(TEMPLATE_TYPE_ENUM, {
    message: TEMPLATE_TYPE_VALIDATION_MESSAGE,
  })
  @IsNotEmpty({ message: 'type cannot be empty' })
  @SanitizeString('lower')
  readonly type?: TemplateType;
}
