jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { BadRequestException, ConflictException } from '@nestjs/common';
import { PortalSolutionService } from './portal-solution.service';

describe('PortalSolutionService', () => {
  const repository = {
    findProviderByCnpj: jest.fn(),
    findUserByEmail: jest.fn(),
    findRoleByName: jest.fn(),
    createProviderWithAdmin: jest.fn(),
    findActiveSaasPlans: jest.fn(),
  };

  const passwordService = {
    hash: jest.fn().mockReturnValue('hashed-password'),
  };

  const authService = {
    generateActivationToken: jest.fn().mockReturnValue({
      token: 'activation-token',
      expiresAt: new Date('2026-05-01'),
    }),
  };

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const service = new PortalSolutionService(
    repository as never,
    passwordService as never,
    authService as never,
    auditService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerProvider', () => {
    const validInput = {
      legalName: 'Posto Teste LTDA',
      tradeName: 'Posto Teste',
      cnpj: '11222333000181', // Valid CNPJ
      email: 'posto@teste.com',
      admin: {
        name: 'Admin Teste',
        email: 'admin@teste.com',
        password: 'Secret123',
      },
      acceptTerms: true,
      ipAddress: '127.0.0.1',
    };

    it('should register a new provider successfully', async () => {
      repository.findProviderByCnpj.mockResolvedValue(null);
      repository.findUserByEmail.mockResolvedValue(null);
      repository.findRoleByName.mockResolvedValue({ id: 'role-1', name: 'PROVIDER_ADMIN' });
      repository.createProviderWithAdmin.mockResolvedValue({
        provider: {
          id: 'provider-1',
          legalName: 'Posto Teste LTDA',
          tradeName: 'Posto Teste',
          cnpj: '11222333000181',
          email: 'posto@teste.com',
          status: 'PENDING_VERIFICATION',
          createdAt: new Date(),
        },
        user: {
          id: 'user-1',
          email: 'admin@teste.com',
          name: 'Admin Teste',
          status: 'PENDING_EMAIL_CONFIRMATION',
          actorType: 'PROVIDER_USER',
        },
      });

      const result = await service.registerProvider(validInput);

      expect(result.provider.status).toBe('PENDING_VERIFICATION');
      expect(result.user.roles).toEqual(['PROVIDER_ADMIN']);
      expect(result.message).toBe('Email de confirmação enviado');
      expect(repository.createProviderWithAdmin).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PROVIDER_REGISTERED' }),
      );
    });

    it('should reject if terms not accepted', async () => {
      await expect(
        service.registerProvider({ ...validInput, acceptTerms: false }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject invalid CNPJ', async () => {
      await expect(
        service.registerProvider({ ...validInput, cnpj: '00000000000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject duplicate CNPJ', async () => {
      repository.findProviderByCnpj.mockResolvedValue({ id: 'existing' });

      await expect(
        service.registerProvider(validInput),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should reject duplicate email', async () => {
      repository.findProviderByCnpj.mockResolvedValue(null);
      repository.findUserByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.registerProvider(validInput),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('listPlans', () => {
    it('should return formatted plans', async () => {
      repository.findActiveSaasPlans.mockResolvedValue([
        {
          id: 'plan-1',
          name: 'Starter',
          code: 'STARTER',
          baseMonthlyPrice: 99,
          maxConvenios: 10,
          maxVehicles: 50,
          maxTransactionsMonth: 1000,
          extraTxPrice: 0.5,
          whitelabelType: 'NONE',
          trialDays: 14,
          suspensionMode: 'FULL_BLOCK',
          gracePeriodDays: 5,
          isActive: true,
        },
      ]);

      const result = await service.listPlans();

      expect(result.plans).toHaveLength(1);
      expect(result.plans[0].code).toBe('STARTER');
      expect(result.plans[0].features.maxConvenios).toBe(10);
    });
  });
});
