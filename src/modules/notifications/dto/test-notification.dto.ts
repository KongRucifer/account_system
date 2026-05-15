import { ApiProperty } from '@nestjs/swagger';

export class TestNotificationDto {
  @ApiProperty({ 
    description: 'Village Bank Code', 
    example: '1004039',
    required: true 
  })
  vbCode: string;

  @ApiProperty({ 
    description: 'Notification message (optional)', 
    example: 'ທົດສອບການແຈ້ງເຕືອນ',
    required: false 
  })
  message?: string;
}
