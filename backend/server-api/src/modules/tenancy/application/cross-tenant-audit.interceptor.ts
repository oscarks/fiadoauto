import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditService } from '../../audit/application/audit.service';
import { TenantContext } from '../domain/tenant-context';
import { TENANT_CONTEXT_KEY } from '../domain/tenant-context.constants';

@Injectable()
export class CrossTenantAuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      query?: { providerId?: string };
      ip?: string;
      headers?: Record<string, string>;
      [TENANT_CONTEXT_KEY]?: TenantContext;
    }>();
    const tenantContext = request[TENANT_CONTEXT_KEY];
    const targetProviderId = request.query?.providerId;

    if (tenantContext?.isAcception() && targetProviderId) {
      void this.auditService.log({
        action: 'ACCEPTION_CROSS_TENANT_ACCESS',
        entity: 'Provider',
        entityId: targetProviderId,
        providerId: targetProviderId,
        userId: tenantContext.userId,
        ipAddress: request.ip ?? null,
        userAgent: request.headers?.['user-agent'] ?? null,
      });
    }

    return next.handle();
  }
}
