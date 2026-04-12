import { Injectable } from '@nestjs/common';
import type { InvoiceStatus, ProviderStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../integrations/storage/prisma/prisma.service';

interface ListProvidersInput {
  page: number;
  limit: number;
  status?: ProviderStatus;
  planId?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ListAuditLogInput {
  page: number;
  limit: number;
  providerId?: string;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class AdminAcceptRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Metrics ──────────────────────────────────────

  async countProvidersByStatus() {
    const results = await this.prisma.provider.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    return results.reduce(
      (acc, r) => {
        acc[r.status] = r._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async calculateMrr() {
    const result = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true },
    });

    const breakdown: Record<string, { amount: number; count: number; plan: string }> = {};
    let total = 0;

    for (const sub of result) {
      const amount = Number(sub.plan.baseMonthlyPrice);
      if (sub.status === 'ACTIVE') {
        total += amount;
      }
      const key = sub.plan.code;
      if (!breakdown[key]) {
        breakdown[key] = { amount: 0, count: 0, plan: sub.plan.name };
      }
      breakdown[key].amount += sub.status === 'ACTIVE' ? amount : 0;
      breakdown[key].count += 1;
    }

    return {
      mrr: total,
      breakdown: Object.values(breakdown).map((b) => ({
        plan: b.plan,
        amount: b.amount,
        tenantCount: b.count,
      })),
    };
  }

  async countTransactionsThisMonth(providerId?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.prisma.refuelTransaction.count({
      where: {
        createdAt: { gte: startOfMonth },
        ...(providerId ? { providerId } : {}),
      },
    });
  }

  async countTrialExpiring(days: number) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.subscription.count({
      where: {
        status: 'TRIAL',
        trialEndsAt: { gte: now, lte: future },
      },
    });
  }

  async countTrialExpiredOverdue() {
    return this.prisma.subscription.count({
      where: {
        status: 'TRIAL',
        trialEndsAt: { lt: new Date() },
      },
    });
  }

  // ── Providers ────────────────────────────────────

  async listProviders(input: ListProvidersInput) {
    const where: Record<string, unknown> = {};
    if (input.status) where.status = input.status;
    if (input.planId) {
      where.subscription = { planId: input.planId };
    }
    if (input.search) {
      where.OR = [
        { legalName: { contains: input.search, mode: 'insensitive' } },
        { tradeName: { contains: input.search, mode: 'insensitive' } },
        { cnpj: { contains: input.search } },
        { email: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        include: {
          subscription: { include: { plan: true } },
        },
        orderBy: { [input.sortBy]: input.sortOrder },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.prisma.provider.count({ where }),
    ]);

    return { data, total };
  }

  findProviderById(id: string) {
    return this.prisma.provider.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
            invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
        users: {
          include: { roles: { include: { role: true } } },
        },
      },
    });
  }

  // ── SaaS Plans ───────────────────────────────────

  async listSaasPlans(input: {
    page: number;
    limit: number;
    isActive?: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Record<string, unknown> = {};
    if (input.isActive !== undefined) where.isActive = input.isActive;

    const [data, total] = await Promise.all([
      this.prisma.saasPlan.findMany({
        where,
        orderBy: { [input.sortBy]: input.sortOrder },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.prisma.saasPlan.count({ where }),
    ]);

    return { data, total };
  }

  findSaasPlanById(id: string) {
    return this.prisma.saasPlan.findUnique({ where: { id } });
  }

  findSaasPlanByCode(code: string) {
    return this.prisma.saasPlan.findUnique({ where: { code } });
  }

  createSaasPlan(input: {
    name: string;
    code: string;
    baseMonthlyPrice: number;
    maxConvenios?: number | null;
    maxVehicles?: number | null;
    maxTransactionsMonth?: number | null;
    extraTxPrice?: number | null;
    whitelabelType?: string;
    trialDays?: number;
    trialMaxTransactions?: number | null;
    suspensionMode?: string;
    gracePeriodDays?: number;
    isActive?: boolean;
  }) {
    return this.prisma.saasPlan.create({
      data: {
        name: input.name,
        code: input.code,
        baseMonthlyPrice: input.baseMonthlyPrice,
        maxConvenios: input.maxConvenios ?? null,
        maxVehicles: input.maxVehicles ?? null,
        maxTransactionsMonth: input.maxTransactionsMonth ?? null,
        extraTxPrice: input.extraTxPrice ?? null,
        whitelabelType: (input.whitelabelType as 'NONE' | 'SUBDOMAIN' | 'CUSTOM_DOMAIN') ?? 'NONE',
        trialDays: input.trialDays ?? 14,
        trialMaxTransactions: input.trialMaxTransactions ?? null,
        suspensionMode:
          (input.suspensionMode as 'FULL_BLOCK' | 'BLOCK_AUTH_ONLY') ?? 'FULL_BLOCK',
        gracePeriodDays: input.gracePeriodDays ?? 5,
        isActive: input.isActive ?? true,
      },
    });
  }

  updateSaasPlan(
    id: string,
    input: {
      name?: string;
      baseMonthlyPrice?: number;
      maxConvenios?: number | null;
      maxVehicles?: number | null;
      maxTransactionsMonth?: number | null;
      extraTxPrice?: number | null;
      whitelabelType?: string;
      trialDays?: number;
      trialMaxTransactions?: number | null;
      suspensionMode?: string;
      gracePeriodDays?: number;
      isActive?: boolean;
    },
  ) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.baseMonthlyPrice !== undefined) data.baseMonthlyPrice = input.baseMonthlyPrice;
    if (input.maxConvenios !== undefined) data.maxConvenios = input.maxConvenios;
    if (input.maxVehicles !== undefined) data.maxVehicles = input.maxVehicles;
    if (input.maxTransactionsMonth !== undefined)
      data.maxTransactionsMonth = input.maxTransactionsMonth;
    if (input.extraTxPrice !== undefined) data.extraTxPrice = input.extraTxPrice;
    if (input.whitelabelType !== undefined) data.whitelabelType = input.whitelabelType;
    if (input.trialDays !== undefined) data.trialDays = input.trialDays;
    if (input.trialMaxTransactions !== undefined)
      data.trialMaxTransactions = input.trialMaxTransactions;
    if (input.suspensionMode !== undefined) data.suspensionMode = input.suspensionMode;
    if (input.gracePeriodDays !== undefined) data.gracePeriodDays = input.gracePeriodDays;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return this.prisma.saasPlan.update({ where: { id }, data });
  }

  deactivateSaasPlan(id: string) {
    return this.prisma.saasPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Subscriptions ────────────────────────────────

  async activateSubscription(providerId: string, planId: string) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { providerId },
        update: {
          planId,
          status: 'ACTIVE' as SubscriptionStatus,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          cancelledAt: null,
        },
        create: {
          providerId,
          planId,
          status: 'ACTIVE' as SubscriptionStatus,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await tx.provider.update({
        where: { id: providerId },
        data: { status: 'ACTIVE' as ProviderStatus },
      });

      return subscription;
    });
  }

  async suspendProvider(
    providerId: string,
    mode: 'SUSPENDED_SAAS_FULL' | 'SUSPENDED_SAAS_AUTH_ONLY',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.update({
        where: { id: providerId },
        data: { status: mode as ProviderStatus },
      });

      const subscription = await tx.subscription.updateMany({
        where: { providerId, status: { not: 'CANCELLED' as SubscriptionStatus } },
        data: { status: 'SUSPENDED' as SubscriptionStatus },
      });

      return { provider, subscriptionUpdated: subscription.count };
    });
  }

  async reactivateProvider(providerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.update({
        where: { id: providerId },
        data: { status: 'ACTIVE' as ProviderStatus },
      });

      const subscription = await tx.subscription.updateMany({
        where: { providerId, status: 'SUSPENDED' as SubscriptionStatus },
        data: { status: 'ACTIVE' as SubscriptionStatus },
      });

      return { provider, subscriptionUpdated: subscription.count };
    });
  }

  // ── Invoices ─────────────────────────────────────

  findSaasInvoiceById(id: string) {
    return this.prisma.saasInvoice.findUnique({
      where: { id },
      include: { subscription: { include: { provider: true } } },
    });
  }

  async markInvoicePaid(id: string, paidAt: Date, externalRef?: string) {
    return this.prisma.saasInvoice.update({
      where: { id },
      data: {
        status: 'PAID' as InvoiceStatus,
        paidAt,
        externalRef: externalRef ?? null,
      },
    });
  }

  // ── Audit Log ────────────────────────────────────

  async listAuditLogs(input: ListAuditLogInput) {
    const where: Record<string, unknown> = {};
    if (input.providerId) where.providerId = input.providerId;
    if (input.actorUserId) where.actorUserId = input.actorUserId;
    if (input.action) where.action = input.action;
    if (input.entityType) where.entityType = input.entityType;
    if (input.entityId) where.entityId = input.entityId;
    if (input.dateFrom || input.dateTo) {
      where.createdAt = {};
      if (input.dateFrom) (where.createdAt as Record<string, unknown>).gte = input.dateFrom;
      if (input.dateTo) (where.createdAt as Record<string, unknown>).lte = input.dateTo;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: input.sortOrder },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  // ── Usage stats (for provider detail) ────────────

  async getProviderUsageStats(providerId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [transactionsThisMonth, activeConvenios, activeVehicles] = await Promise.all([
      this.prisma.refuelTransaction.count({
        where: { providerId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.conveniado.count({
        where: { providerId, status: 'ACTIVE' },
      }),
      this.prisma.vehicle.count({
        where: { providerId, status: 'ACTIVE' },
      }),
    ]);

    return { transactionsThisMonth, activeConvenios, activeVehicles };
  }
}
