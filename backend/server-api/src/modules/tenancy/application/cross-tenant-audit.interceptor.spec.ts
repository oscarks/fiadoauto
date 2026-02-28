import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { UserRole } from '@prisma/client';
import { TenantContext } from '../domain/tenant-context';
import { TENANT_CONTEXT_KEY } from '../domain/tenant-context.constants';
import { CrossTenantAuditInterceptor } from './cross-tenant-audit.interceptor';

function createHttpContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('CrossTenantAuditInterceptor', () => {
  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const next: CallHandler = {
    handle: () => of({ ok: true }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log cross-tenant access for acception admin', () => {
    const interceptor = new CrossTenantAuditInterceptor(auditService as never);
    const request = {
      query: { providerId: 'provider-1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
      [TENANT_CONTEXT_KEY]: new TenantContext(
        null,
        null,
        'user-1',
        UserRole.ACCEPTION_ADMIN,
        'ACCEPTION',
      ),
    };

    interceptor.intercept(createHttpContext(request), next).subscribe();

    expect(auditService.log).toHaveBeenCalled();
  });

  it('should not log for provider users', () => {
    const interceptor = new CrossTenantAuditInterceptor(auditService as never);
    const request = {
      query: { providerId: 'provider-1' },
      [TENANT_CONTEXT_KEY]: new TenantContext(
        'provider-1',
        null,
        'user-1',
        UserRole.PROVIDER_ADMIN,
        'PROVIDER',
      ),
    };

    interceptor.intercept(createHttpContext(request), next).subscribe();

    expect(auditService.log).not.toHaveBeenCalled();
  });
});
