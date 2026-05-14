import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: '02012345678', description: 'Phone number registered in your account' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  phoneNumber: string;

  @ApiProperty({ example: 'newpassword123', description: 'New password (min 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
