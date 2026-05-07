import { Module } from '@nestjs/common';
import { VbcodeController } from './vbcode.controller';
import { VbcodeService } from './vbcode.service';

@Module({
  controllers: [VbcodeController],
  providers: [VbcodeService],
})
export class VbcodeModule {}
