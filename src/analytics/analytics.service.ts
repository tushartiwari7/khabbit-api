import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly posthog: PostHog;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('POSTHOG_API_KEY');
    const host = this.config.get<string>('POSTHOG_HOST', 'https://us.i.posthog.com');

    if (apiKey) {
      this.posthog = new PostHog(apiKey, { host });
    } else {
      this.logger.warn('PostHog API key not set — analytics disabled');
      this.posthog = null as unknown as PostHog;
    }
  }

  capture(userId: string, event: string, properties?: Record<string, unknown>) {
    if (!this.posthog) return;
    this.posthog.capture({
      distinctId: userId,
      event,
      properties,
    });
  }

  async onModuleDestroy() {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }
}
