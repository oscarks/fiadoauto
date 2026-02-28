import { Module } from '@nestjs/common';
import { AuditService } from './application/audit.service';
import { GetAuditLogByIdUseCase, ListAuditLogsUseCase } from './application/list-audit-logs.use-case';
import { AuditLogController } from './presentation/audit-log.controller';

@Module({
  imports: [],
  controllers: [AuditLogController],
  providers: [AuditService, ListAuditLogsUseCase, GetAuditLogByIdUseCase],
  exports: [AuditService],
})
export class AuditModule {}
