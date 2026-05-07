import { Module } from '@nestjs/common';
import { SystemUserController } from './system-user.controller';
import { SystemUserService } from './system-user.service';

@Module({
  controllers: [SystemUserController],
  providers: [SystemUserService],
})
export class SystemUserModule {}
