import { BadRequestException } from '@nestjs/common';
import { VerifyEmailUseCase } from './verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  const emailTokenRepository = {
    findByToken: jest.fn(),
    markUsed: jest.fn(),
  };
  const userRepository = {
    activateUser: jest.fn(),
  };

  const useCase = new VerifyEmailUseCase(emailTokenRepository as never, userRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify email successfully', async () => {
    emailTokenRepository.findByToken.mockResolvedValue({
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await useCase.execute({ token: 'token' });

    expect(result).toEqual({ message: 'Email verificado com sucesso.' });
    expect(emailTokenRepository.markUsed).toHaveBeenCalled();
    expect(userRepository.activateUser).toHaveBeenCalledWith('user-1', expect.any(Date));
  });

  it('should fail for expired token', async () => {
    emailTokenRepository.findByToken.mockResolvedValue({
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(useCase.execute({ token: 'token' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should fail for already used token', async () => {
    emailTokenRepository.findByToken.mockResolvedValue({
      userId: 'user-1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(useCase.execute({ token: 'token' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
