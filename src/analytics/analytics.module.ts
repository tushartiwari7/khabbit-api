import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsInterceptor } from './analytics.interceptor';

@Module({
  providers: [AnalyticsService, AnalyticsInterceptor],
  exports: [AnalyticsService, AnalyticsInterceptor],
})
export class AnalyticsModule {}
