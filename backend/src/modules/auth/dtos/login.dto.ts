import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';

export class LoginDto {
  @ApiProperty({ description: 'Email or username', example: 'user1' })
  @IsString()
  @IsNotEmpty({ message: 'username or email is required' })
  @SanitizeString('lower')
  readonly username!: string;

  @ApiProperty({ example: 'SecretPass1' })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  readonly password!: string;
}
