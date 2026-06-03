import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Login payload for an internal SYSTEM user (table `system_user`).
 * Used by the offline-capable Flutter management app.
 */
export class SystemLoginDto {
  @ApiProperty({ example: 'admin', description: 'system_user.user_name' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({ example: 'admin1234', description: 'system_user.password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
