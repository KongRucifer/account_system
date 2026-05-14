import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'john_doe', description: 'Client username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'client1234', description: 'Client account password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
