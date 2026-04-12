import { Module } from '@nestjs/common';
import { AuditModule } from '../../core/audit/audit.module';
import { BillingSaasService } from './application/billing-saas.service';
import { BillingSaasRepository } from './infrastructure/billing-saas.repository';

@Module({
  imports: [AuditModule],
  providers: [BillingSaasService, BillingSaasRepository],
  exports: [BillingSaasService],
})
export class BillingSaasModule {}
