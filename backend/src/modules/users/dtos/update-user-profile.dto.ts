import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { SanitizeString } from '../../../common/decorators';

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'user1', pattern: '^[a-z][a-z0-9]*$' })
  @IsOptional()
  @Length(3, 25, { message: 'username must have 3-25 characters' })
  @Matches(/^[a-z]/, { message: 'username must start with a letter' })
  @IsAlphanumeric('en-US', { message: 'username must contain only letters and digits' })
  @IsString()
  @IsNotEmpty({ message: 'username cannot be empty' })
  @SanitizeString('lower')
  readonly username?: string;

  @ApiProperty({ example: 'Alice Smith' })
  @IsOptional()
  @MaxLength(50, { message: 'full name must be at most 50 characters' })
  @IsString()
  @SanitizeString('any')
  readonly fullName?: string;

  @ApiProperty({
    description: 'Any information the user wants to share about themselves',
    example: 'Love creating presentations',
  })
  @IsOptional()
  @MaxLength(200, { message: 'about section must be at most 200 characters' })
  @SanitizeString('any')
  readonly about?: string;
}
