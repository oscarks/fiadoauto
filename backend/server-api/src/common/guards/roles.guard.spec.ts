import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new RolesGuard(reflector as unknown as Reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createExecutionContext(roles: string[]): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          authContext: {
            roles,
          },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('allows when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createExecutionContext([]))).toBe(true);
  });

  it('allows when user has at least one required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROVIDER_ADMIN']);

    expect(guard.canActivate(createExecutionContext(['PROVIDER_ADMIN']))).toBe(true);
  });

  it('denies when user has none of required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['PROVIDER_ADMIN']);

    expect(() => guard.canActivate(createExecutionContext(['PROVIDER_OPERATOR']))).toThrow(
      'Insufficient role',
    );
  });
});
