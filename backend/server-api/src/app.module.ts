import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/infrastructure/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { LocaleInterceptor } from './modules/i18n/presentation/locale.interceptor';
import { I18nModule } from './modules/i18n/i18n.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { RolesGuard } from './modules/rbac/presentation/roles.guard';
import { RbacModule } from './modules/rbac/rbac.module';
import { CrossTenantAuditInterceptor } from './modules/tenancy/application/cross-tenant-audit.interceptor';
import { TenantGuard } from './modules/tenancy/presentation/tenant.guard';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { envValidationSchema } from './shared/config/env.validation';
import { HealthModule } from './shared/health/health.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    AuditModule,
    I18nModule,
    ProvidersModule,
    TenancyModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LocaleInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CrossTenantAuditInterceptor,
    },
  ],
})
export class AppModule {}
