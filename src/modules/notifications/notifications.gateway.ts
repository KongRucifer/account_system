import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  // เก็บ mapping ของ username -> Set ของ socket ids (รองรับหลาย device)
  private userSocketMap: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // ตรวจสอบ JWT token จาก handshake auth
      const token = client.handshake.auth.token;
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      // JWT sub = bankbookNumber — look up the actual username from DB
      const bankbookNumber = payload.sub;
      if (!bankbookNumber) {
        this.logger.warn('Client connected without sub in token');
        client.disconnect();
        return;
      }

      const clientAccount = await this.prisma.clientAccount.findFirst({
        where: { bankbookNumber },
        select: { username: true },
      });
      const username = clientAccount?.username;

      if (!username) {
        this.logger.warn(`No account found for bankbookNumber: ${bankbookNumber}`);
        client.disconnect();
        return;
      }

      // บันทึก mapping (รองรับหลาย device ต่อ username)
      if (!this.userSocketMap.has(username)) {
        this.userSocketMap.set(username, new Set());
      }
      this.userSocketMap.get(username)!.add(client.id);
      client.data.username = username;

      // เข้าห้องส่วนตัวของ user (ทุก device อยู่ห้องเดียวกัน)
      client.join(`user:${username}`);

      this.logger.log(`Client connected: ${username} (${client.id}), total devices: ${this.userSocketMap.get(username)!.size}`);

      // ส่งยืนยันการเชื่อมต่อ
      client.emit('connected', {
        message: 'Connected to notifications server',
        username,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Invalid token:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const username = client.data?.username;
    if (username) {
      const sockets = this.userSocketMap.get(username);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSocketMap.delete(username);
        }
      }
      this.logger.log(`Client disconnected: ${username} (${client.id})`);
    }
  }

  // ส่ง notification ไปยัง user เฉพาะคน
  sendNotificationToUser(username: string, notification: any) {
    const room = `user:${username}`;
    this.server.to(room).emit('new_notification', {
      type: 'meeting_reminder',
      data: notification,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Sent notification to ${username}: ${notification.message}`);
  }

  // ส่ง notification ไปยังหลาย users พร้อมกัน
  sendNotificationToMultipleUsers(usernames: string[], notification: any) {
    usernames.forEach((username) => {
      this.sendNotificationToUser(username, notification);
    });
  }

  // ตรวจสอบว่า user ออนไลน์อยู่หรือไม่
  isUserOnline(username: string): boolean {
    const sockets = this.userSocketMap.get(username);
    return !!sockets && sockets.size > 0;
  }

  // ดูจำนวน users ที่ออนไลน์
  getOnlineUsersCount(): number {
    return this.userSocketMap.size;
  }

  // Client ส่งข้อความมาจะได้รับการตอบกลับ
  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      onlineUsers: this.getOnlineUsersCount(),
    });
  }

  // Client mark notification as read ผ่าน WebSocket
  @SubscribeMessage('mark_as_read')
  handleMarkAsRead(client: Socket, payload: { notificationId: string }) {
    const username = client.data?.username;
    if (!username) return;

    // Broadcast ไปยังทุก device ของ username นี้ (รวม device ที่กดด้วย)
    this.server.to(`user:${username}`).emit('notification_read', {
      notificationId: payload.notificationId,
      readAt: new Date().toISOString(),
    });
    this.logger.log(`mark_as_read broadcast to all devices of ${username}: ${payload.notificationId}`);
  }

  // Broadcast all_notifications_read ไปยังทุก device ของ username
  broadcastAllRead(username: string) {
    this.server.to(`user:${username}`).emit('all_notifications_read', {
      readAt: new Date().toISOString(),
    });
    this.logger.log(`all_notifications_read broadcast to all devices of ${username}`);
  }

  // Client ส่ง mark_all_as_read ผ่าน WebSocket
  @SubscribeMessage('mark_all_as_read')
  handleMarkAllAsRead(client: Socket) {
    const username = client.data?.username;
    if (!username) return;

    // Broadcast ไปยังทุก device ของ username นี้
    this.broadcastAllRead(username);
    this.logger.log(`mark_all_as_read broadcast to all devices of ${username}`);
  }
}
