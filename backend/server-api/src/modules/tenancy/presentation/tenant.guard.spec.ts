import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ExecutionContext } from '@nestjs/common';
import { TENANT_CONTEXT_KEY } from '../domain/tenant-context.constants';
import { TenantGuard } from './tenant.guard';

function createHttpContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => class TestClass {},
  } as ExecutionContext;
}

describe('TenantGuard', () => {
  let guard: TenantGuard;
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
    guard = new TenantGuard(reflector as never);
  });

  it('should build tenant context for provider user', () => {
    const request: Record<string, unknown> = {
      user: {
        userId: 'user-1',
        role: UserRole.PROVIDER_ADMIN,
        providerId: 'provider-1',
        conveniadoId: null,
      },
      query: {},
    };

    const canActivate = guard.canActivate(createHttpContext(request));
    expect(canActivate).toBe(true);
    expect((request[TENANT_CONTEXT_KEY] as { actorType: string }).actorType).toBe('PROVIDER');
  });

  it('should build tenant context for conveniado user', () => {
    const request: Record<string, unknown> = {
      user: {
        userId: 'user-1',
        role: UserRole.CONVENIADO_ADMIN,
        providerId: 'provider-1',
        conveniadoId: 'conv-1',
      },
      query: {},
    };

    guard.canActivate(createHttpContext(request));
    expect((request[TENANT_CONTEXT_KEY] as { actorType: string }).actorType).toBe('CONVENIADO');
  });

  it('should allow acception admin to override provider by query param', () => {
    const request: Record<string, unknown> = {
      user: {
        userId: 'user-1',
        role: UserRole.ACCEPTION_ADMIN,
        providerId: null,
        conveniadoId: null,
      },
      query: {
        providerId: 'provider-target',
      },
    };

    guard.canActivate(createHttpContext(request));
    expect((request[TENANT_CONTEXT_KEY] as { providerId: string }).providerId).toBe(
      'provider-target',
    );
  });

  it('should throw when request user is missing', () => {
    const request: Record<string, unknown> = { query: {} };

    expect(() => guard.canActivate(createHttpContext(request))).toThrow(UnauthorizedException);
  });

  it('should skip guard for public endpoints', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const request: Record<string, unknown> = {};

    expect(guard.canActivate(createHttpContext(request))).toBe(true);
  });
});
