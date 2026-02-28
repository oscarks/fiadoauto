import { BadRequestException } from '@nestjs/common';
import { ResetPasswordUseCase } from './reset-password.use-case';

describe('ResetPasswordUseCase', () => {
  const emailTokenRepository = {
    findByToken: jest.fn(),
    markUsed: jest.fn(),
  };
  const userRepository = {
    updatePasswordHash: jest.fn(),
  };
  const hashingService = {
    hash: jest.fn(),
  };
  const tokenService = {
    revokeAllUserRefreshTokens: jest.fn(),
  };

  const useCase = new ResetPasswordUseCase(
    emailTokenRepository as never,
    userRepository as never,
    hashingService as never,
    tokenService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reset password successfully', async () => {
    emailTokenRepository.findByToken.mockResolvedValue({
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    hashingService.hash.mockResolvedValue('new-hash');

    const result = await useCase.execute({
      token: 'token',
      newPassword: 'NewPass123',
    });

    expect(result).toEqual({ message: 'Senha redefinida com sucesso.' });
    expect(userRepository.updatePasswordHash).toHaveBeenCalledWith('user-1', 'new-hash');
    expect(tokenService.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-1');
  });

  it('should fail for weak password', async () => {
    await expect(
      useCase.execute({
        token: 'token',
        newPassword: 'weak',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should fail for invalid token', async () => {
    emailTokenRepository.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({
        token: 'token',
        newPassword: 'Strong123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
