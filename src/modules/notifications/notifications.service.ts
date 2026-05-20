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
      // หา FCM tokens ทั้งหมดของ user (ทุก device)
      const devices = await this.prisma.deviceFcm.findMany({
        where: { username },
        select: { fcmToken: true, deviceId: true },
      });

      const tokens = devices.map(d => d.fcmToken).filter((t): t is string => !!t);

      if (tokens.length === 0) {
        console.warn(`⚠️ No FCM tokens found for user: ${username}`);
        return;
      }

      if (tokens.length === 1) {
        await this.firebaseService.sendPushNotification(
          tokens[0],
          notification.title,
          notification.body,
          notification.data,
        );
      } else {
        await this.firebaseService.sendMulticastNotification(
          tokens,
          notification.title,
          notification.body,
          notification.data,
        );
      }

      console.log(`✅ FCM sent to user: ${username} (${tokens.length} device(s))`);
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

  async updateFcmToken(username: string, deviceId: string, fcmToken: string | null) {
    // Upsert by composite key (username + deviceId) — supports multiple devices per user
    await this.prisma.deviceFcm.upsert({
      where: { username_deviceId: { username, deviceId } },
      create: {
        username,
        deviceId,
        fcmToken,
        fcmTokenUpdatedAt: fcmToken ? new Date() : null,
      },
      update: {
        fcmToken,
        fcmTokenUpdatedAt: fcmToken ? new Date() : null,
      },
    });
  }

  async getDeviceFcmByUsername(username: string) {
    return this.prisma.deviceFcm.findMany({
      where: { username },
    });
  }

  async deleteDeviceFcm(username: string) {
    await this.prisma.deviceFcm.deleteMany({
      where: { username },
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

    // Broadcast ไปยังทุก device ของ username เดียวกัน
    this.notificationsGateway.server
      .to(`user:${username}`)
      .emit('notification_read', {
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

    // Broadcast all_notifications_read ไปยังทุก device ของ username เดียวกัน
    this.notificationsGateway.broadcastAllRead(username);

    return result.count;
  }
}
