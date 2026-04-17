import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsAlphanumeric,
  Length,
  Matches,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';
import { SanitizeString } from '../../../common/decorators';

export class RegisterDto {
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

  @ApiProperty({ example: 'SecretPass1', minLength: 8 })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    },
    { message: 'password must be longer than 8 characters (A-Z, a-z, 0-9)' },
  )
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  readonly password!: string;
}
