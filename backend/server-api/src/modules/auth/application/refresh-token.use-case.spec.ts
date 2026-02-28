import { UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  const userRepository = {
    findById: jest.fn(),
  };
  const tokenService = {
    validateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    getAccessExpirationSeconds: jest.fn(),
  };

  const useCase = new RefreshTokenUseCase(userRepository as never, tokenService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should rotate refresh token', async () => {
    tokenService.validateRefreshToken.mockResolvedValue({
      userId: 'user-1',
    });
    userRepository.findById.mockResolvedValue({
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
    tokenService.generateAccessToken.mockReturnValue('new-access');
    tokenService.generateRefreshToken.mockResolvedValue('new-refresh');
    tokenService.getAccessExpirationSeconds.mockReturnValue(900);

    const result = await useCase.execute({ refreshToken: 'old-refresh' });

    expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('old-refresh');
    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresIn: 900,
    });
  });

  it('should fail when refresh token is invalid', async () => {
    tokenService.validateRefreshToken.mockRejectedValue(new UnauthorizedException());

    await expect(useCase.execute({ refreshToken: 'invalid' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should fail when user is not active', async () => {
    tokenService.validateRefreshToken.mockResolvedValue({
      userId: 'user-1',
    });
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.BLOCKED,
    });

    await expect(useCase.execute({ refreshToken: 'old-refresh' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
