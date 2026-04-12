import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../integrations/storage/prisma/prisma.service';

@Injectable()
export class BillingSaasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExpiredTrials() {
    return this.prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: { lt: new Date() },
      },
      include: {
        provider: true,
        plan: true,
      },
    });
  }

  async expireTrialSubscription(subscriptionId: string, providerId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'SUSPENDED' },
      });

      await tx.provider.update({
        where: { id: providerId },
        data: { status: 'SUSPENDED_SAAS_FULL' },
      });
    });
  }

  async findActiveSubscriptionsForBilling() {
    return this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lte: new Date() },
      },
      include: {
        provider: true,
        plan: true,
      },
    });
  }

  async createSaasInvoice(input: {
    providerId: string;
    subscriptionId: string;
    periodStart: Date;
    periodEnd: Date;
    baseAmount: number;
    usageAmount: number;
    totalAmount: number;
    dueDate: Date;
  }) {
    return this.prisma.saasInvoice.create({
      data: {
        providerId: input.providerId,
        subscriptionId: input.subscriptionId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        baseAmount: input.baseAmount,
        usageAmount: input.usageAmount,
        totalAmount: input.totalAmount,
        dueDate: input.dueDate,
        status: 'OPEN',
      },
    });
  }

  async advanceSubscriptionPeriod(subscriptionId: string, periodStart: Date, periodEnd: Date) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  async countProviderTransactionsInPeriod(providerId: string, start: Date, end: Date) {
    return this.prisma.refuelTransaction.count({
      where: {
        providerId,
        createdAt: { gte: start, lt: end },
      },
    });
  }

  async findOverdueInvoices() {
    return this.prisma.saasInvoice.findMany({
      where: {
        status: 'OPEN',
        dueDate: { lt: new Date() },
      },
      include: {
        subscription: { include: { provider: true, plan: true } },
      },
    });
  }

  async markInvoiceOverdue(invoiceId: string) {
    return this.prisma.saasInvoice.update({
      where: { id: invoiceId },
      data: { status: 'PAST_DUE' },
    });
  }

  async suspendProviderForNonPayment(providerId: string, mode: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.provider.update({
        where: { id: providerId },
        data: { status: mode as 'SUSPENDED_SAAS_FULL' | 'SUSPENDED_SAAS_AUTH_ONLY' },
      });

      await tx.subscription.updateMany({
        where: { providerId, status: { not: 'CANCELLED' } },
        data: { status: 'SUSPENDED' },
      });
    });
  }
}
