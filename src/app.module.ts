import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SystemUserModule } from './modules/system-user/system-user.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { VbcodeModule } from './modules/vbcode/vbcode.module';
import { CnyLakRateModule } from './modules/cny-lak-rate/cny-lak-rate.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SystemUserModule,
    RolesModule,
    PermissionsModule,
    AccountsModule,
    VbcodeModule,
    CnyLakRateModule,
    TransactionsModule,
  ],
})
export class AppModule {}
