import { Module } from '@nestjs/common';
import { AuditService } from './application/audit.service';
import { AuditRepository } from './infrastructure/audit.repository';

@Module({
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}
