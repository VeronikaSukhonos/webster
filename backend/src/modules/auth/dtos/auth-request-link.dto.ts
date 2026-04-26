import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { SanitizeString } from '../../../common/decorators';

export class AuthRequestLinkDto {
  @ApiProperty({ example: 'user1@gmail.com' })
  @IsEmail({}, { message: 'email must be valid' })
  @IsNotEmpty({ message: 'email is required' })
  @SanitizeString('lower')
  readonly email!: string;
}
