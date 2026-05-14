import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '00001', description: 'Client bankbook number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  bankbookNumber: string;

  @ApiProperty({ example: 'VB00101', description: 'Village bank code (ເລກລະຫັດບ້ານ)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  vbCode: string;

  @ApiProperty({ example: 'john_doe', description: 'Unique username (max 50 chars)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: '02012345678', description: 'Phone number', required: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  phoneNumber: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'password123', description: 'Confirm password' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
