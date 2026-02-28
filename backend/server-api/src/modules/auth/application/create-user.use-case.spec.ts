import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  const userRepository = {
    findByEmail: jest.fn().mockResolvedValue(null),
    createInProvider: jest.fn(),
  };
  const hashingService = {
    hash: jest.fn(),
  };
  const auditService = {
    log: jest.fn(),
  };

  const useCase = new CreateUserUseCase(
    userRepository as never,
    hashingService as never,
    auditService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject creation with unsupported role', async () => {
    await expect(
      useCase.execute('provider-1', {
        email: 'user@test.com',
        name: 'User',
        password: 'User@123',
        role: UserRole.PROVIDER_ADMIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
