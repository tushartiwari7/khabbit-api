import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(private analytics: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.analytics.capture(
            request.user?.id || 'anonymous',
            'api_request',
            {
              method: request.method,
              path: request.route?.path || request.url,
              status_code: response.statusCode,
              response_time_ms: Date.now() - startTime,
            },
          );
        },
        error: (err) => {
          this.analytics.capture(
            request.user?.id || 'anonymous',
            'api_request_error',
            {
              method: request.method,
              path: request.route?.path || request.url,
              error: err.message,
              response_time_ms: Date.now() - startTime,
            },
          );
        },
      }),
    );
  }
}
