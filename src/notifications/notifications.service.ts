import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  async sendPush(pushToken: string, title: string, body: string, data?: Record<string, unknown>) {
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(`Invalid Expo push token: ${pushToken}`);
      return;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    try {
      const [ticket] = await this.expo.sendPushNotificationsAsync([message]);
      this.logger.log(`Push sent: ${JSON.stringify(ticket)}`);
      return ticket;
    } catch (err) {
      this.logger.error(`Push failed: ${err}`);
    }
  }

  async sendPushBatch(tokens: string[], title: string, body: string) {
    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t))
      .map((token) => ({ to: token, sound: 'default' as const, title, body }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        this.logger.error(`Batch push failed: ${err}`);
      }
    }
  }
}
