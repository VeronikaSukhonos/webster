import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';
import { TemplateType } from '../template-type.enum';

export class CreateTemplateFromProjectDto {
  @ApiProperty({ example: 'Template from my project' })
  @MaxLength(100, { message: 'title must be at most 100 characters' })
  @IsString()
  @IsNotEmpty({ message: 'title cannot be empty' })
  @SanitizeString('any')
  readonly title!: string;

  @ApiProperty({ enum: TemplateType, example: TemplateType.InstagramPost })
  @IsEnum(TemplateType, {
    message:
      'type must be one of the following values: other, collage, instagram-post, instagram-story, invitation, presentation, resume',
  })
  @IsNotEmpty({ message: 'type cannot be empty' })
  @SanitizeString('lower')
  readonly type!: TemplateType;
}
