import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsAlphanumeric,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';
import { SanitizeString } from '../../../common/decorators';

export class RegisterDto extends ResetPasswordDto {
  @ApiProperty({ example: 'user1', pattern: '^[a-z][a-z0-9]*$' })
  @Length(3, 25, { message: 'username must have 3-25 characters' })
  @Matches(/^[a-z]/, { message: 'username must start with a letter' })
  @IsAlphanumeric('en-US', { message: 'username must contain only letters and digits' })
  @IsString()
  @IsNotEmpty({ message: 'username is required' })
  @SanitizeString('lower')
  readonly username!: string;

  @ApiProperty({ example: 'user1@gmail.com' })
  @MaxLength(100, { message: 'email must be at most 100 characters' })
  @IsEmail({}, { message: 'email must be valid' })
  @IsNotEmpty({ message: 'email is required' })
  @SanitizeString('lower')
  readonly email!: string;
}
