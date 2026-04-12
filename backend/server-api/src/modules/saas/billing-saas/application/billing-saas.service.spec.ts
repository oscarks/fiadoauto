jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { BillingSaasService } from './billing-saas.service';

describe('BillingSaasService', () => {
  const repository = {
    findExpiredTrials: jest.fn(),
    expireTrialSubscription: jest.fn(),
    findActiveSubscriptionsForBilling: jest.fn(),
    countProviderTransactionsInPeriod: jest.fn(),
    createSaasInvoice: jest.fn(),
    advanceSubscriptionPeriod: jest.fn(),
    findOverdueInvoices: jest.fn(),
    markInvoiceOverdue: jest.fn(),
    suspendProviderForNonPayment: jest.fn(),
  };

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const service = new BillingSaasService(repository as never, auditService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleExpiredTrials', () => {
    it('should expire overdue trial subscriptions', async () => {
      repository.findExpiredTrials.mockResolvedValue([
        {
          id: 'sub1',
          providerId: 'p1',
          trialEndsAt: new Date('2026-04-01'),
          provider: { tradeName: 'Posto A' },
          plan: { code: 'STARTER' },
        },
      ]);
      repository.expireTrialSubscription.mockResolvedValue(undefined);

      await service.handleExpiredTrials();

      expect(repository.expireTrialSubscription).toHaveBeenCalledWith('sub1', 'p1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TRIAL_EXPIRED' }),
      );
    });

    it('should handle no expired trials', async () => {
      repository.findExpiredTrials.mockResolvedValue([]);

      await service.handleExpiredTrials();

      expect(repository.expireTrialSubscription).not.toHaveBeenCalled();
    });
  });

  describe('handleMonthlyInvoices', () => {
    it('should generate invoices for active subscriptions with expired periods', async () => {
      const periodEnd = new Date('2026-04-01');
      const periodStart = new Date('2026-03-01');

      repository.findActiveSubscriptionsForBilling.mockResolvedValue([
        {
          id: 'sub1',
          providerId: 'p1',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          provider: { tradeName: 'Posto A' },
          plan: {
            code: 'STARTER',
            baseMonthlyPrice: 199.9,
            maxTransactionsMonth: 1000,
            extraTxPrice: 0.5,
          },
        },
      ]);
      repository.countProviderTransactionsInPeriod.mockResolvedValue(1050);
      repository.createSaasInvoice.mockResolvedValue({ id: 'inv1' });
      repository.advanceSubscriptionPeriod.mockResolvedValue(undefined);
      repository.findOverdueInvoices.mockResolvedValue([]);

      await service.handleMonthlyInvoices();

      expect(repository.createSaasInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: 'p1',
          baseAmount: 199.9,
          usageAmount: 25, // 50 overage * 0.5
          totalAmount: 224.9,
        }),
      );
      expect(repository.advanceSubscriptionPeriod).toHaveBeenCalledTimes(1);
    });

    it('should handle overdue invoices past grace period', async () => {
      repository.findActiveSubscriptionsForBilling.mockResolvedValue([]);

      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 20);

      repository.findOverdueInvoices.mockResolvedValue([
        {
          id: 'inv1',
          dueDate: pastDueDate,
          subscription: {
            providerId: 'p1',
            provider: { tradeName: 'Posto A' },
            plan: { gracePeriodDays: 5, suspensionMode: 'FULL_BLOCK' },
          },
        },
      ]);
      repository.markInvoiceOverdue.mockResolvedValue(undefined);
      repository.suspendProviderForNonPayment.mockResolvedValue(undefined);

      await service.handleMonthlyInvoices();

      expect(repository.markInvoiceOverdue).toHaveBeenCalledWith('inv1');
      expect(repository.suspendProviderForNonPayment).toHaveBeenCalledWith(
        'p1',
        'SUSPENDED_SAAS_FULL',
      );
    });
  });
});
