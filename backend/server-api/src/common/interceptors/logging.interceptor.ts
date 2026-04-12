import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const durationMs = Date.now() - startTime;

        this.logger.log(
          JSON.stringify({
            method,
            url,
            statusCode: response.statusCode,
            durationMs,
            requestId: (request as any).requestId ?? null,
            providerId: (request as any).authContext?.providerId ?? null,
          }),
        );
      }),
    );
  }
}
