import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class MeetingReminderCron {
  private readonly logger = new Logger(MeetingReminderCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // @Cron('0 18 * * *') // รันทุกวันเวลา 18:00 น.
  @Cron('0 18 * * *') // รันทุกวันเวลา 18:00 น.
  async handleMeetingReminder() {
    this.logger.log('Starting meeting reminder check at 18:00');

    try {
      // 1. หาวันพรุ่งนี้
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.getDate(); // 1-31

      this.logger.log(`Checking for meetings on date: ${tomorrowDate}`);

      // 2. ค้นหา villageBank ที่มี monthlyMeetingDate = tomorrowDate
      const villageBanks = await this.prisma.villageBank.findMany({
        where: { monthlyMeetingDate: tomorrowDate },
      });

      this.logger.log(`Found ${villageBanks.length} village banks with meeting tomorrow`);

      // 3. สำหรับแต่ละ village bank
      for (const vb of villageBanks) {
        await this.processVillageBank(vb.vbCode, tomorrow);
      }

      this.logger.log('Meeting reminder check completed successfully');
    } catch (error) {
      this.logger.error('Error in meeting reminder cron job:', error);
    }
  }

  private async processVillageBank(vbCode: string, meetingDate: Date) {
    try {
      // 3.1 ตรวจสอบว่าส่ง notification นี้ไปแล้วหรือยัง
      const exists = await this.notificationsService.checkExistingNotification(
        vbCode,
        meetingDate,
      );

      if (exists) {
        this.logger.log(`Notification already sent for vbCode: ${vbCode} on ${meetingDate.toDateString()}`);
        return;
      }

      // 3.2 สร้าง notification
      const message = 'ມື້ອື່ນມີການປະຊຸມທະນາຄານບ້ານ';
      const notification = await this.notificationsService.createMeetingNotification(
        vbCode,
        meetingDate,
        message,
      );

      this.logger.log(`Created notification: ${notification.id} for vbCode: ${vbCode}`);

      // 3.3 หา ClientAccount ที่มี vbCode ตรงกัน
      const clientAccounts = await this.prisma.clientAccount.findMany({
        where: { vbCode },
      });

      this.logger.log(`Found ${clientAccounts.length} client accounts for vbCode: ${vbCode}`);

      // 3.4 สร้าง ClientNotification สำหรับแต่ละ account
      for (const account of clientAccounts) {
        try {
          await this.notificationsService.createClientNotification(
            notification.id,
            account.username,
          );
          this.logger.log(`Created client notification for user: ${account.username}`);
        } catch (err) {
          this.logger.error(`Failed to create notification for user ${account.username}:`, err);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing village bank ${vbCode}:`, error);
    }
  }

  // สำหรับทดสอบ - ดู village banks ที่จะมี meeting พรุ่งนี้
  async previewMeetingsTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.getDate();

    const villageBanks = await this.prisma.villageBank.findMany({
      where: { monthlyMeetingDate: tomorrowDate },
    });

    // หาจำนวน client สำหรับแต่ละ village bank
    const villageBanksWithClientCount = await Promise.all(
      villageBanks.map(async (vb) => {
        const clientCount = await this.prisma.clientAccount.count({
          where: { vbCode: vb.vbCode },
        });
        return {
          vbCode: vb.vbCode,
          nameLao: vb.nameLao,
          nameEng: vb.nameEng,
          monthlyMeetingDate: vb.monthlyMeetingDate,
          clientCount,
        };
      }),
    );

    return {
      tomorrowDate: tomorrow.toISOString().split('T')[0],
      tomorrowDay: tomorrowDate,
      villageBanks: villageBanksWithClientCount,
      totalVillageBanks: villageBanks.length,
      totalClients: villageBanksWithClientCount.reduce((sum, vb) => sum + vb.clientCount, 0),
    };
  }

  // สำหรับทดสอบ - ส่ง notification ทันที (ไม่ต้องรอพรุ่งนี้)
  async testSendNotificationNow(vbCode: string, message: string) {
    const now = new Date();
    
    this.logger.log(`[TEST] Sending immediate notification for vbCode: ${vbCode}`);

    // สร้าง notification ทันที
    const notification = await this.notificationsService.createMeetingNotification(
      vbCode,
      now,
      message,
    );

    this.logger.log(`[TEST] Created notification: ${notification.id}`);

    // หา ClientAccount ที่มี vbCode ตรงกัน
    const clientAccounts = await this.prisma.clientAccount.findMany({
      where: { vbCode },
    });

    this.logger.log(`[TEST] Found ${clientAccounts.length} client accounts`);

    const results: Array<{ username: string; status: string; error?: string }> = [];

    // สร้าง ClientNotification สำหรับแต่ละ account
    for (const account of clientAccounts) {
      try {
        await this.notificationsService.createClientNotification(
          notification.id,
          account.username,
        );
        this.logger.log(`[TEST] Sent to user: ${account.username}`);
        results.push({ username: account.username, status: 'sent' });
      } catch (err) {
        this.logger.error(`[TEST] Failed for ${account.username}:`, err);
        results.push({ username: account.username, status: 'failed', error: (err as Error).message });
      }
    }

    return {
      notificationId: notification.id,
      vbCode,
      message,
      totalClients: clientAccounts.length,
      sentCount: results.filter(r => r.status === 'sent').length,
      results,
    };
  }
}


// 18:00 น. ของทุกวัน → เช็ค villageBank.monthlyMeetingDate → 
// ถ้าตรงกับพรุ่งนี้ → สร้าง notification → 
// หา ClientAccount ที่มี vbCode ตรงกัน → 
// บันทึก ClientNotification → 
// Flutter polling → แสดงผล "ມື້ອື່ນມີການປະຊຸມທະນາຄານບ້ານ"
// Step 5: ทดสอบตามลำดับ
// เรียก GET /notifications/test/preview-meetings → ดูว่ามี village bank ไหนบ้าง
// เรียก POST /notifications/test/trigger-meeting-reminder → สร้าง notifications
// เรียก GET /notifications/unread?username={username} → ตรวจสอบ notifications