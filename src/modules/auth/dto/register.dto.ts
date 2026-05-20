import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

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

  @ApiProperty({ example: 'Password@123', description: 'Password (min 8 chars, must contain special character)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
    message: 'Password must contain at least one special character',
  })
  password: string;

  @ApiProperty({ example: 'password123', description: 'Confirm password' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
