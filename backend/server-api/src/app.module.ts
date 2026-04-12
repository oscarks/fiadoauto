import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditModule } from './modules/core/audit/audit.module';
import { AuthModule } from './modules/core/auth/auth.module';
import { I18nModule } from './modules/core/i18n/i18n.module';
import { RbacModule } from './modules/core/rbac/rbac.module';
import { TenancyModule } from './modules/core/tenancy/tenancy.module';
import { ObservabilityModule } from './modules/integrations/observability/observability.module';
import { PrismaModule } from './modules/integrations/storage/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ObservabilityModule,
    AuditModule,
    AuthModule,
    RbacModule,
    TenancyModule,
    I18nModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
