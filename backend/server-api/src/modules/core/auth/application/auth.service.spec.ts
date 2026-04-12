jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const repository = {
    findUserByEmail: jest.fn(),
    createRefreshToken: jest.fn(),
    findRefreshTokenByHash: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllUserRefreshTokens: jest.fn(),
    findUserById: jest.fn(),
  };

  const tokenService = {
    generateAccessToken: jest.fn().mockReturnValue('access-token'),
  };

  const passwordService = {
    verify: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const service = new AuthService(
    repository as never,
    tokenService as never,
    passwordService as never,
    auditService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login active user and return tokens', async () => {
    repository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@fiadoauto.com',
      passwordHash: 'hash',
      providerId: 'provider-1',
      conveniadoId: null,
      actorType: 'PROVIDER_USER',
      status: 'ACTIVE',
      provider: { status: 'ACTIVE' },
      roles: [{ role: { name: 'PROVIDER_ADMIN' } }],
    });
    passwordService.verify.mockReturnValue(true);
    repository.createRefreshToken.mockResolvedValue(undefined);
    auditService.log.mockResolvedValue(undefined);

    const result = await service.login({
      email: 'test@fiadoauto.com',
      password: 'secret',
      ipAddress: '127.0.0.1',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeDefined();
    expect(result.user.roles).toEqual(['PROVIDER_ADMIN']);
    expect(repository.createRefreshToken).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'AUTH_LOGIN' }),
    );
  });

  it('should deny suspended provider login (FULL_BLOCK)', async () => {
    repository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
      providerId: 'provider-1',
      actorType: 'PROVIDER_USER',
      provider: { status: 'SUSPENDED_SAAS_FULL' },
      status: 'ACTIVE',
      roles: [],
    });
    passwordService.verify.mockReturnValue(true);

    await expect(
      service.login({
        email: 'test@fiadoauto.com',
        password: 'secret',
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should deny cancelled provider login', async () => {
    repository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
      providerId: 'provider-1',
      actorType: 'PROVIDER_USER',
      provider: { status: 'CANCELLED' },
      status: 'ACTIVE',
      roles: [],
    });
    passwordService.verify.mockReturnValue(true);

    await expect(
      service.login({
        email: 'test@fiadoauto.com',
        password: 'secret',
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should rotate refresh token', async () => {
    repository.findRefreshTokenByHash.mockResolvedValue({
      id: 'refresh-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 5 * 60_000),
      user: {
        id: 'user-1',
        providerId: 'provider-1',
        conveniadoId: null,
        actorType: 'PROVIDER_USER',
        roles: [{ role: { name: 'PROVIDER_ADMIN' } }],
      },
    });

    const result = await service.refresh({ refreshToken: 'raw-refresh-token' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeDefined();
    expect(repository.revokeRefreshToken).toHaveBeenCalledWith('refresh-1');
    expect(repository.createRefreshToken).toHaveBeenCalledTimes(1);
  });

  it('should reject invalid refresh token', async () => {
    repository.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(service.refresh({ refreshToken: 'invalid' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
