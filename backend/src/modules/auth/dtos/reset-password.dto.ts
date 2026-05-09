import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'SecretPass1', minLength: 8 })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    },
    { message: 'password must be at least 8 characters (A-Z, a-z, 0-9)' },
  )
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  readonly password!: string;
}
