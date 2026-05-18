import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseService } from './services/firebase.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly firebaseService: FirebaseService,
  ) {}

  async createMeetingNotification(vbCode: string, meetingDate: Date, message: string) {
    return this.prisma.meetingNotification.create({
      data: {
        vbCode,
        meetingDate,
        message,
      },
    });
  }

  async checkExistingNotification(vbCode: string, meetingDate: Date): Promise<boolean> {
    const startOfDay = new Date(meetingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(meetingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.prisma.meetingNotification.count({
      where: {
        vbCode,
        meetingDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return count > 0;
  }

  async createClientNotification(notificationId: string, username: string) {
    // สร้าง notification ในฐานข้อมูล
    const clientNotification = await this.prisma.clientMeetingNotification.create({
      data: {
        notificationId,
        username,
      },
      include: {
        notification: true,
      },
    });

    // ส่ง WebSocket event ถ้า user ออนไลน์
    this.notificationsGateway.sendNotificationToUser(username, {
      id: clientNotification.id,
      notificationId: clientNotification.notificationId,
      message: clientNotification.notification.message,
      meetingDate: clientNotification.notification.meetingDate,
      vbCode: clientNotification.notification.vbCode,
      createdAt: clientNotification.createdAt,
    });

    // 🔥 ส่ง FCM Push Notification
    await this.sendPushNotificationToUser(username, {
      title: 'ແຈ້ງເຕືອນການປະຊຸມ', // Meeting Notification
      body: clientNotification.notification.message,
      data: {
        type: 'new_notification',
        notificationId: clientNotification.id,
        meetingDate: clientNotification.notification.meetingDate.toISOString(),
        vbCode: clientNotification.notification.vbCode,
      },
    });

    return clientNotification;
  }

  /**
   * Send FCM push notification to a specific user
   */
  private async sendPushNotificationToUser(
    username: string,
    notification: { title: string; body: string; data?: Record<string, string> },
  ) {
    try {
      // หา FCM token ของ user
      const clientAccount = await this.prisma.clientAccount.findUnique({
        where: { username },
        select: { fcmToken: true },
      });

      if (clientAccount?.fcmToken) {
        await this.firebaseService.sendPushNotification(
          clientAccount.fcmToken,
          notification.title,
          notification.body,
          notification.data,
        );
      }
    } catch (error) {
      console.error('❌ Failed to send push notification:', error.message);
    }
  }

  async getUnreadNotifications(username: string) {
    const notifications = await this.prisma.clientMeetingNotification.findMany({
      where: {
        username,
        isRead: false,
      },
      include: {
        notification: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const unreadCount = notifications.length;

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        notificationId: n.notificationId,
        message: n.notification.message,
        meetingDate: n.notification.meetingDate,
        vbCode: n.notification.vbCode,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  }

  async getAllNotifications(username: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;
    
    // Calculate date thresholds
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    const [notifications, totalCount] = await Promise.all([
      this.prisma.clientMeetingNotification.findMany({
        where: {
          username,
          // Show only unread notifications, or read notifications from last 2 days
          OR: [
            { isRead: false },
            { 
              isRead: true,
              createdAt: { gte: twoDaysAgo }
            }
          ]
        },
        include: {
          notification: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.clientMeetingNotification.count({
        where: {
          username,
          // Count only unread notifications, or read notifications from last 2 days
          OR: [
            { isRead: false },
            { 
              isRead: true,
              createdAt: { gte: twoDaysAgo }
            }
          ]
        },
      }),
    ]);

    const unreadCount = await this.prisma.clientMeetingNotification.count({
      where: {
        username,
        isRead: false,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        notificationId: n.notificationId,
        message: n.notification.message,
        meetingDate: n.notification.meetingDate,
        vbCode: n.notification.vbCode,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async updateFcmToken(username: string, fcmToken: string | null) {
    await this.prisma.clientAccount.update({
      where: { username },
      data: {
        fcmToken,
        fcmTokenUpdatedAt: fcmToken ? new Date() : null,
      },
    });
  }

  async markAsRead(notificationId: string, username: string) {
    const clientNotification = await this.prisma.clientMeetingNotification.findFirst({
      where: {
        notificationId,
        username,
      },
    });

    if (!clientNotification) {
      return null;
    }

    const updated = await this.prisma.clientMeetingNotification.update({
      where: {
        id: clientNotification.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // ส่ง WebSocket event แจ้งว่าอ่านแล้ว
    this.notificationsGateway.sendNotificationToUser(username, {
      type: 'notification_read',
      notificationId,
      readAt: updated.readAt,
    });

    return updated;
  }

  async markAllAsRead(username: string) {
    const result = await this.prisma.clientMeetingNotification.updateMany({
      where: {
        username,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // ส่ง WebSocket event แจ้งว่าอ่านทั้งหมดแล้ว
    this.notificationsGateway.sendNotificationToUser(username, {
      type: 'all_notifications_read',
      count: result.count,
      readAt: new Date(),
    });

    return result.count;
  }
}
