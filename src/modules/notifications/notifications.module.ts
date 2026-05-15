import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MeetingReminderCron } from './cron/meeting-reminder.cron';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseService } from './services/firebase.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, MeetingReminderCron, NotificationsGateway, FirebaseService],
  exports: [NotificationsService, NotificationsGateway, FirebaseService],
})
export class NotificationsModule {}
