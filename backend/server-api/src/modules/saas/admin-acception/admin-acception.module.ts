import { Module } from '@nestjs/common';
import { AuditModule } from '../../core/audit/audit.module';
import { AdminAcceptService } from './application/admin-acception.service';
import { AdminAcceptRepository } from './infrastructure/admin-acception.repository';
import { AdminProviderController } from './presentation/admin-provider.controller';
import { AdminSaasPlanController } from './presentation/admin-saas-plan.controller';
import { AdminMetricsController } from './presentation/admin-metrics.controller';
import { AdminAuditController } from './presentation/admin-audit.controller';
import { AdminInvoiceController } from './presentation/admin-invoice.controller';

@Module({
  imports: [AuditModule],
  controllers: [
    AdminProviderController,
    AdminSaasPlanController,
    AdminMetricsController,
    AdminAuditController,
    AdminInvoiceController,
  ],
  providers: [AdminAcceptService, AdminAcceptRepository],
})
export class AdminAcceptModule {}
