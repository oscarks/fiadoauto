import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../rbac/presentation/roles.decorator';
import { TenantContext } from '../../tenancy/domain/tenant-context';
import { CurrentTenant } from '../../tenancy/presentation/current-tenant.decorator';
import { GetAuditLogByIdUseCase, ListAuditLogsUseCase } from '../application/list-audit-logs.use-case';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Controller('audit-logs')
@Roles(UserRole.PROVIDER_ADMIN, UserRole.ACCEPTION_ADMIN)
export class AuditLogController {
  constructor(
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly getAuditLogByIdUseCase: GetAuditLogByIdUseCase,
  ) {}

  @Get()
  list(@CurrentTenant() tenantContext: TenantContext, @Query() query: AuditLogQueryDto) {
    const providerId = tenantContext.isProvider()
      ? tenantContext.requireProviderId()
      : query.providerId;

    return this.listAuditLogsUseCase.execute({
      ...query,
      providerId,
    });
  }

  @Get(':id')
  detail(@CurrentTenant() tenantContext: TenantContext, @Param('id') id: string) {
    return this.getAuditLogByIdUseCase.execute(
      id,
      tenantContext.isProvider() ? tenantContext.requireProviderId() : undefined,
    );
  }
}
