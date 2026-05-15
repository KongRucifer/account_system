import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
        this.logger.log('✅ Firebase Admin initialized successfully');
      } else {
        this.firebaseApp = admin.apps[0]!;
      }
    } catch (error) {
      this.logger.error('❌ Failed to initialize Firebase Admin:', error.message);
    }
  }

  /**
   * Send push notification to a specific device
   */
  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'meeting_notifications',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`📱 Push notification sent: ${response}`);
    } catch (error) {
      this.logger.error('❌ Failed to send push notification:', error.message);
      
      // If token is invalid, we should remove it from database
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`⚠️ Invalid FCM token: ${fcmToken}`);
        // TODO: Remove invalid token from database
      }
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticastNotification(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (fcmTokens.length === 0) {
      this.logger.warn('⚠️ No FCM tokens provided for multicast');
      return;
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'meeting_notifications',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `📱 Multicast notification sent: ${response.successCount} successful, ${response.failureCount} failed`,
      );

      // Log failed tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.logger.error(`❌ Failed to send to token ${fcmTokens[idx]}: ${resp.error?.message}`);
        }
      });
    } catch (error) {
      this.logger.error('❌ Failed to send multicast notification:', error.message);
    }
  }

  /**
   * Send notification to a topic
   */
  async sendTopicNotification(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'meeting_notifications',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`📱 Topic notification sent to ${topic}: ${response}`);
    } catch (error) {
      this.logger.error('❌ Failed to send topic notification:', error.message);
    }
  }
}
