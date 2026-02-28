import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CrossTenantAuditInterceptor } from './application/cross-tenant-audit.interceptor';
import { TenantGuard } from './presentation/tenant.guard';

@Module({
  imports: [AuditModule],
  controllers: [],
  providers: [TenantGuard, CrossTenantAuditInterceptor],
  exports: [TenantGuard, CrossTenantAuditInterceptor],
})
export class TenancyModule {}
