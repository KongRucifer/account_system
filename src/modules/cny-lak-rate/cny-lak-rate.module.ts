import { Module } from '@nestjs/common';
import { CnyLakRateController } from './cny-lak-rate.controller';
import { CnyLakRateService } from './cny-lak-rate.service';

@Module({
  controllers: [CnyLakRateController],
  providers: [CnyLakRateService],
})
export class CnyLakRateModule {}
