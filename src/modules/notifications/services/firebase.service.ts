import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

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
        let credential;

        // Determine project root directory
        const projectRoot = process.cwd();
        
        // Try to load from service account JSON file first
        // Check multiple possible locations
        const possiblePaths = [
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
          path.join(projectRoot, 'firebase-service-account.json'),
          path.join(projectRoot, 'dist', 'firebase-service-account.json'),
          './firebase-service-account.json',
        ].filter(Boolean);

        let serviceAccountPath: string | null = null;
        for (const p of possiblePaths) {
          if (p && fs.existsSync(p)) {
            serviceAccountPath = p;
            break;
          }
        }

        if (serviceAccountPath) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          credential = admin.credential.cert(serviceAccount);
          this.logger.log(`✅ Loaded Firebase service account from: ${serviceAccountPath}`);
        } else {
          // Fall back to environment variables
          if (!process.env.FIREBASE_PROJECT_ID) {
            throw new Error('FIREBASE_PROJECT_ID not set and no service account file found. Searched: ' + possiblePaths.join(', '));
          }
          credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          });
          this.logger.log('✅ Loaded Firebase credentials from environment variables');
        }

        this.firebaseApp = admin.initializeApp({ credential });
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
        // Data-only message: forces the background Dart isolate to handle it
        // so our custom channel (with sound) is always used on Android
        data: {
          ...(data || {}),
          title,
          body,
        },
        android: {
          priority: 'high',
          // No android.notification block — data-only, Dart handles display
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
          headers: {
            'apns-priority': '5',
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
        // Data-only message: forces the background Dart isolate to handle it
        data: {
          ...(data || {}),
          title,
          body,
        },
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
          headers: {
            'apns-priority': '5',
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
        // Data-only message: forces the background Dart isolate to handle it
        data: {
          ...(data || {}),
          title,
          body,
        },
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
          headers: {
            'apns-priority': '5',
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
