import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '00001', description: 'Client bankbook number' })
  @IsString()
  @IsNotEmpty()
  bankbookNumber: string;

  @ApiProperty({ example: 'client1234', description: 'Client account password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
