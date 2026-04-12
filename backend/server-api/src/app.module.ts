import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SuspensionGuard } from './common/guards/suspension.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditModule } from './modules/core/audit/audit.module';
import { AuthModule } from './modules/core/auth/auth.module';
import { I18nModule } from './modules/core/i18n/i18n.module';
import { RbacModule } from './modules/core/rbac/rbac.module';
import { TenancyModule } from './modules/core/tenancy/tenancy.module';
import { ObservabilityModule } from './modules/integrations/observability/observability.module';
import { PrismaModule } from './modules/integrations/storage/prisma/prisma.module';
import { PortalSolutionModule } from './modules/saas/portal-solution/portal-solution.module';
import { AdminAcceptModule } from './modules/saas/admin-acception/admin-acception.module';
import { BillingSaasModule } from './modules/saas/billing-saas/billing-saas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 60000,   // 1 minuto
          limit: 20,    // 20 requests por minuto (geral)
        },
        {
          name: 'long',
          ttl: 900000,  // 15 minutos
          limit: 100,   // 100 requests por 15min (geral)
        },
      ],
    }),
    PrismaModule,
    ObservabilityModule,
    AuditModule,
    AuthModule,
    RbacModule,
    TenancyModule,
    I18nModule,
    // SaaS modules (Sprint 02)
    PortalSolutionModule,
    AdminAcceptModule,
    BillingSaasModule,
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
      provide: APP_GUARD,
      useClass: SuspensionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
