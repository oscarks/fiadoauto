import { Module } from '@nestjs/common';
import { AppI18nService } from './application/i18n.service';
import { LocaleInterceptor } from './presentation/locale.interceptor';

@Module({
  imports: [],
  controllers: [],
  providers: [AppI18nService, LocaleInterceptor],
  exports: [AppI18nService, LocaleInterceptor],
})
export class I18nModule {}
