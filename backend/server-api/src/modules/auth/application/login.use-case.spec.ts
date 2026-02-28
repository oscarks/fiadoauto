import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  const userRepository = {
    findByEmail: jest.fn(),
    updateLastLoginAt: jest.fn(),
  };
  const hashingService = {
    compare: jest.fn(),
  };
  const tokenService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    getAccessExpirationSeconds: jest.fn(),
  };
  const rateLimiter = {
    check: jest.fn(),
    registerFailure: jest.fn(),
    registerSuccess: jest.fn(),
  };

  const useCase = new LoginUseCase(
    userRepository as never,
    hashingService as never,
    tokenService as never,
    rateLimiter as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@acception.com',
      passwordHash: 'hash',
      name: 'Admin',
      role: UserRole.ACCEPTION_ADMIN,
      status: UserStatus.ACTIVE,
      providerId: null,
      conveniadoId: null,
      emailVerifiedAt: new Date(),
      lastLoginAt: null,
    });
    hashingService.compare.mockResolvedValue(true);
    tokenService.generateAccessToken.mockReturnValue('access-token');
    tokenService.generateRefreshToken.mockResolvedValue('refresh-token');
    tokenService.getAccessExpirationSeconds.mockReturnValue(900);

    const result = await useCase.execute({
      email: 'admin@acception.com',
      password: 'Admin@123',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    });
    expect(rateLimiter.registerSuccess).toHaveBeenCalledWith('admin@acception.com');
    expect(userRepository.updateLastLoginAt).toHaveBeenCalled();
  });

  it('should fail with invalid password', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@acception.com',
      passwordHash: 'hash',
      name: 'Admin',
      role: UserRole.ACCEPTION_ADMIN,
      status: UserStatus.ACTIVE,
      providerId: null,
      conveniadoId: null,
      emailVerifiedAt: new Date(),
      lastLoginAt: null,
    });
    hashingService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'admin@acception.com',
        password: 'wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(rateLimiter.registerFailure).toHaveBeenCalledWith('admin@acception.com');
  });

  it('should fail when user is blocked', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@acception.com',
      passwordHash: 'hash',
      name: 'Admin',
      role: UserRole.ACCEPTION_ADMIN,
      status: UserStatus.BLOCKED,
      providerId: null,
      conveniadoId: null,
      emailVerifiedAt: null,
      lastLoginAt: null,
    });

    await expect(
      useCase.execute({
        email: 'admin@acception.com',
        password: 'Admin@123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should fail when user is pending verification', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@acception.com',
      passwordHash: 'hash',
      name: 'Admin',
      role: UserRole.ACCEPTION_ADMIN,
      status: UserStatus.PENDING_VERIFICATION,
      providerId: null,
      conveniadoId: null,
      emailVerifiedAt: null,
      lastLoginAt: null,
    });

    await expect(
      useCase.execute({
        email: 'admin@acception.com',
        password: 'Admin@123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
