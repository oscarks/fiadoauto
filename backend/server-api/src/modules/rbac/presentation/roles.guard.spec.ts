import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ExecutionContext } from '@nestjs/common';
import { TENANT_CONTEXT_KEY } from '../../tenancy/domain/tenant-context.constants';
import { RolesGuard } from './roles.guard';

function createHttpContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => class TestClass {},
  } as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('should allow access for public endpoint', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);

    const canActivate = guard.canActivate(createHttpContext({}));
    expect(canActivate).toBe(true);
  });

  it('should allow access when role is permitted', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce([
      UserRole.PROVIDER_ADMIN,
    ]);

    const request = {
      [TENANT_CONTEXT_KEY]: {
        role: UserRole.PROVIDER_ADMIN,
      },
    };

    const canActivate = guard.canActivate(createHttpContext(request));
    expect(canActivate).toBe(true);
  });

  it('should deny access when role is not permitted', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce([
      UserRole.PROVIDER_ADMIN,
    ]);

    const request = {
      [TENANT_CONTEXT_KEY]: {
        role: UserRole.PROVIDER_OPERATOR,
      },
    };

    expect(() => guard.canActivate(createHttpContext(request))).toThrow(ForbiddenException);
  });
});
