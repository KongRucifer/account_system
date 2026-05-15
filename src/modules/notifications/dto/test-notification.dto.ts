import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class TestNotificationDto {
  @ApiProperty({ 
    description: 'Village Bank Code', 
    example: '1004039',
    required: true 
  })
  @IsString()
  vbCode: string;

  @ApiProperty({ 
    description: 'Notification message (optional)', 
    example: 'ທົດສອບການແຈ້ງເຕືອນ',
    required: false 
  })
  @IsOptional()
  @IsString()
  message?: string;
}
