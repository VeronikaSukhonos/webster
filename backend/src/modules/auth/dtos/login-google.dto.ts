import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginGoogleDto {
  @ApiProperty({ description: 'Authorization Code from the Google Authorization Server' })
  @IsString()
  @IsNotEmpty({ message: 'code is required' })
  readonly code!: string;
}
