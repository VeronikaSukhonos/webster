import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ResetPasswordDto } from '../../auth/dtos';

export class UpdateUserPasswordDto extends ResetPasswordDto {
  @ApiProperty({
    description: "User's current password, required only for username/password-registered users",
    example: 'SecretPass1',
  })
  @IsOptional()
  @IsString()
  readonly currentPassword?: string;
}
