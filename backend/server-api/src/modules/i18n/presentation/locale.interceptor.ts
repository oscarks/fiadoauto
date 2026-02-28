import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppI18nService } from '../application/i18n.service';

@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  constructor(private readonly i18nService: AppI18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | undefined>;
      locale?: string;
    }>();

    request.locale = this.i18nService.resolveLocale(request.headers?.['accept-language']);
    return next.handle();
  }
}
