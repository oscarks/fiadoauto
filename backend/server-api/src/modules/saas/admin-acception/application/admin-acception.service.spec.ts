jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminAcceptService } from './admin-acception.service';

describe('AdminAcceptService', () => {
  const repository = {
    countProvidersByStatus: jest.fn(),
    calculateMrr: jest.fn(),
    countTransactionsThisMonth: jest.fn(),
    countTrialExpiring: jest.fn(),
    countTrialExpiredOverdue: jest.fn(),
    listProviders: jest.fn(),
    findProviderById: jest.fn(),
    getProviderUsageStats: jest.fn(),
    listSaasPlans: jest.fn(),
    findSaasPlanById: jest.fn(),
    findSaasPlanByCode: jest.fn(),
    createSaasPlan: jest.fn(),
    updateSaasPlan: jest.fn(),
    deactivateSaasPlan: jest.fn(),
    activateSubscription: jest.fn(),
    suspendProvider: jest.fn(),
    reactivateProvider: jest.fn(),
    findSaasInvoiceById: jest.fn(),
    markInvoicePaid: jest.fn(),
    listAuditLogs: jest.fn(),
  };

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const service = new AdminAcceptService(repository as never, auditService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return dashboard metrics', async () => {
      repository.countProvidersByStatus.mockResolvedValue({
        ACTIVE: 5,
        TRIAL_ACTIVE: 3,
        SUSPENDED_SAAS_FULL: 1,
        SUSPENDED_SAAS_AUTH_ONLY: 0,
      });
      repository.calculateMrr.mockResolvedValue({
        mrr: 2500,
        breakdown: [{ plan: 'Starter', amount: 1000, tenantCount: 5 }],
      });
      repository.countTransactionsThisMonth.mockResolvedValue(150);
      repository.countTrialExpiring.mockResolvedValue(2);
      repository.countTrialExpiredOverdue.mockResolvedValue(1);

      const result = await service.getMetrics();

      expect(result.metrics.tenantsActive).toBe(5);
      expect(result.metrics.tenantsTrial).toBe(3);
      expect(result.metrics.mrr).toBe(2500);
      expect(result.metrics.trialExpiringNext7Days).toBe(2);
    });
  });

  describe('listProviders', () => {
    it('should return paginated providers', async () => {
      repository.listProviders.mockResolvedValue({
        data: [
          {
            id: 'p1',
            legalName: 'Posto A',
            tradeName: 'A',
            cnpj: '11222333000181',
            email: 'a@test.com',
            status: 'ACTIVE',
            createdAt: new Date(),
            subscription: {
              id: 's1',
              planId: 'plan1',
              plan: { name: 'Starter' },
              status: 'ACTIVE',
              trialEndsAt: null,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(),
            },
          },
        ],
        total: 1,
      });

      const result = await service.listProviders({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('createSaasPlan', () => {
    it('should create a new plan', async () => {
      repository.findSaasPlanByCode.mockResolvedValue(null);
      repository.createSaasPlan.mockResolvedValue({
        id: 'plan-new',
        name: 'Premium',
        code: 'PREMIUM',
      });

      const result = await service.createSaasPlan({
        name: 'Premium',
        code: 'PREMIUM',
        baseMonthlyPrice: 799,
        actorUserId: 'admin-1',
        ipAddress: '127.0.0.1',
      });

      expect(result.code).toBe('PREMIUM');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SAAS_PLAN_CREATED' }),
      );
    });

    it('should reject duplicate plan code', async () => {
      repository.findSaasPlanByCode.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createSaasPlan({
          name: 'Starter',
          code: 'STARTER',
          baseMonthlyPrice: 99,
          actorUserId: 'admin-1',
          ipAddress: '127.0.0.1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('activateSubscription', () => {
    it('should activate provider subscription', async () => {
      repository.findProviderById.mockResolvedValue({ id: 'p1' });
      repository.findSaasPlanById.mockResolvedValue({ id: 'plan1' });
      repository.activateSubscription.mockResolvedValue({
        id: 'sub1',
        providerId: 'p1',
        planId: 'plan1',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      });

      const result = await service.activateSubscription(
        'p1',
        { planId: 'plan1' },
        'admin-1',
        '127.0.0.1',
      );

      expect(result.message).toBe('Assinatura ativada');
      expect(result.subscription.status).toBe('ACTIVE');
    });

    it('should throw if provider not found', async () => {
      repository.findProviderById.mockResolvedValue(null);

      await expect(
        service.activateSubscription('invalid', { planId: 'plan1' }, 'admin-1', '127.0.0.1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('suspendProvider', () => {
    it('should suspend provider with FULL_BLOCK', async () => {
      repository.findProviderById.mockResolvedValue({ id: 'p1' });
      repository.suspendProvider.mockResolvedValue({
        provider: { id: 'p1', status: 'SUSPENDED_SAAS_FULL' },
        subscriptionUpdated: 1,
      });

      const result = await service.suspendProvider(
        'p1',
        { suspensionMode: 'FULL_BLOCK', reason: 'Non-payment' },
        'admin-1',
        '127.0.0.1',
      );

      expect(result.provider.status).toBe('SUSPENDED_SAAS_FULL');
    });
  });

  describe('reactivateProvider', () => {
    it('should reactivate provider', async () => {
      repository.findProviderById.mockResolvedValue({ id: 'p1' });
      repository.reactivateProvider.mockResolvedValue({
        provider: { id: 'p1', status: 'ACTIVE' },
        subscriptionUpdated: 1,
      });

      const result = await service.reactivateProvider('p1', {}, 'admin-1', '127.0.0.1');

      expect(result.provider.status).toBe('ACTIVE');
    });
  });

  describe('markInvoicePaid', () => {
    it('should mark invoice as paid', async () => {
      repository.findSaasInvoiceById.mockResolvedValue({
        id: 'inv1',
        providerId: 'p1',
        subscription: {
          provider: { id: 'p1', status: 'ACTIVE' },
        },
      });
      repository.markInvoicePaid.mockResolvedValue({
        id: 'inv1',
        providerId: 'p1',
        status: 'PAID',
        paidAt: new Date(),
        totalAmount: 199.9,
      });

      const result = await service.markInvoicePaid('inv1', {}, 'admin-1', '127.0.0.1');

      expect(result.invoice.status).toBe('PAID');
    });

    it('should reactivate suspended provider when invoice paid', async () => {
      repository.findSaasInvoiceById.mockResolvedValue({
        id: 'inv1',
        providerId: 'p1',
        subscription: {
          provider: { id: 'p1', status: 'SUSPENDED_SAAS_FULL' },
        },
      });
      repository.markInvoicePaid.mockResolvedValue({
        id: 'inv1',
        providerId: 'p1',
        status: 'PAID',
        paidAt: new Date(),
        totalAmount: 199.9,
      });
      repository.reactivateProvider.mockResolvedValue({
        provider: { id: 'p1', status: 'ACTIVE' },
      });

      const result = await service.markInvoicePaid('inv1', {}, 'admin-1', '127.0.0.1');

      expect(repository.reactivateProvider).toHaveBeenCalledWith('p1');
      expect(result.provider.status).toBe('ACTIVE');
    });
  });

  describe('listAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      repository.listAuditLogs.mockResolvedValue({
        data: [
          {
            id: 'log1',
            providerId: 'p1',
            actorUserId: 'u1',
            actorType: 'ACCEPTION_ADMIN',
            action: 'PROVIDER_SUSPENDED',
            entityType: 'Provider',
            entityId: 'p1',
            detailsJson: {},
            ipAddress: '127.0.0.1',
            createdAt: new Date(),
          },
        ],
        total: 1,
      });

      const result = await service.listAuditLogs({
        page: 1,
        limit: 50,
        sortOrder: 'DESC',
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});
