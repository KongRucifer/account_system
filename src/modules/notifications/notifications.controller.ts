import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { MeetingReminderCron } from './cron/meeting-reminder.cron';
import { TestNotificationDto } from './dto/test-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly meetingReminderCron: MeetingReminderCron,
  ) {}

  @Get('unread')
  async getUnreadNotifications(@Query('username') username: string) {
    if (!username) {
      return {
        status: 'error',
        message: 'Username is required',
        notifications: [],
        unreadCount: 0,
      };
    }
    return this.notificationsService.getUnreadNotifications(username);
  }

  @Get()
  async getAllNotifications(
    @Query('username') username: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
  ) {
    if (!username) {
      return {
        status: 'error',
        message: 'Username is required',
        notifications: [],
        unreadCount: 0,
        pagination: null,
      };
    }
    return this.notificationsService.getAllNotifications(username, page, limit);
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @Body('username') username: string,
  ) {
    if (!username) {
      return {
        status: 'error',
        message: 'Username is required',
      };
    }

    const result = await this.notificationsService.markAsRead(notificationId, username);
    
    if (!result) {
      return {
        status: 'error',
        message: 'Notification not found',
      };
    }

    return {
      status: 'success',
      message: 'Notification marked as read',
    };
  }

  @Patch('fcm-token')
  async updateFcmToken(
    @Body('username') username: string,
    @Body('deviceId') deviceId: string,
    @Body('fcmToken') fcmToken: string | null,
  ) {
    if (!username) {
      return { status: 'error', message: 'Username is required' };
    }
    if (!deviceId) {
      return { status: 'error', message: 'Device ID is required' };
    }
    await this.notificationsService.updateFcmToken(username, deviceId, fcmToken ?? null);
    return { status: 'success', message: 'FCM token updated' };
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Body('username') username: string) {
    if (!username) {
      return { status: 'error', message: 'Username is required' };
    }
    const result = await this.notificationsService.markAllAsRead(username);
    return {
      status: 'success',
      message: 'All notifications marked as read',
      count: result,
    };
  }

  // Manual trigger for testing - เรียก cron job ทันที
  @Post('test/trigger-meeting-reminder')
  async triggerMeetingReminder() {
    try {
      await this.meetingReminderCron.handleMeetingReminder();
      return {
        status: 'success',
        message: 'Meeting reminder cron job triggered manually',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to trigger cron job',
        error: error.message,
      };
    }
  }

  // Test - ส่ง notification ทันที (ไม่ต้องรอพรุ่งนี้)
  @Post('test/send-notification-now')
  @ApiBody({ type: TestNotificationDto })
  async sendNotificationNow(@Body() dto: TestNotificationDto) {
    try {
      if (!dto.vbCode) {
        return {
          status: 'error',
          message: 'vbCode is required in request body',
        };
      }
      
      const result = await this.meetingReminderCron.testSendNotificationNow(
        dto.vbCode,
        dto.message || 'ທົດສອບການແຈ້ງເຕືອນ (Test Notification)',
      );
      return {
        status: 'success',
        message: 'Test notification sent',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to send test notification',
        error: error.message,
      };
    }
  }

  // Preview - ดู village banks ที่จะมี meeting พรุ่งนี้
  @Get('test/preview-meetings')
  async previewMeetings() {
    return this.meetingReminderCron.previewMeetingsTomorrow();
  }
}
