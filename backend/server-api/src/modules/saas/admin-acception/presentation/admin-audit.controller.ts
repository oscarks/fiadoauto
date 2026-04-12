import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AdminAcceptService } from '../application/admin-acception.service';
import { ListAuditLogDto } from './dto/list-audit-log.dto';

@Controller('api/admin/audit-log')
@Roles('ACCEPTION_ADMIN')
export class AdminAuditController {
  constructor(private readonly service: AdminAcceptService) {}

  @Get()
  listAuditLogs(@Query() query: ListAuditLogDto) {
    return this.service.listAuditLogs({
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      providerId: query.providerId,
      actorUserId: query.actorUserId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortOrder: query.sortOrder ?? 'DESC',
    });
  }
}
