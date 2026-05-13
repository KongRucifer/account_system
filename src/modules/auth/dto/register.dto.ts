import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '00001', description: 'Client bankbook number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  bankbookNumber: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'client1234', description: 'Confirm password' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({ example: '02012345678', description: 'Client phone number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  phoneNumber: string;

  @ApiProperty({ example: 'VB001', description: 'Village bank code (ເລກລະຫັດບ້ານ)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  vbCode: string;
}
