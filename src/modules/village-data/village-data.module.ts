import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VillageDataController } from './village-data.controller';
import { VillageDataService } from './village-data.service';

@Module({
  imports: [AuthModule], // for JwtAuthGuard / JwtStrategy
  controllers: [VillageDataController],
  providers: [VillageDataService],
})
export class VillageDataModule {}
