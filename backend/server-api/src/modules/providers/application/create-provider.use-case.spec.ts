import { UnprocessableEntityException } from '@nestjs/common';
import { CreateProviderUseCase } from './create-provider.use-case';

describe('CreateProviderUseCase', () => {
  const providerRepository = {
    create: jest.fn(),
  };
  const hashingService = {
    hash: jest.fn(),
  };
  const auditService = {
    log: jest.fn(),
  };

  const useCase = new CreateProviderUseCase(
    providerRepository as never,
    hashingService as never,
    auditService as never,
  );

  it('should reject invalid cnpj', async () => {
    await expect(
      useCase.execute({
        legalName: 'Provider LTDA',
        tradeName: 'Provider',
        cnpj: '123',
        email: 'provider@test.com',
        responsibleName: 'Resp',
        address: {},
        adminUser: {
          email: 'admin@test.com',
          name: 'Admin',
          password: 'Admin@123',
        },
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
