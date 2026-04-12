import { Injectable, NotFoundException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { AuditService } from '../../../core/audit/application/audit.service';
import { AdminAcceptRepository } from '../infrastructure/admin-acception.repository';

@Injectable()
export class AdminAcceptService {
  constructor(
    private readonly repository: AdminAcceptRepository,
    private readonly auditService: AuditService,
  ) {}

  // ── Metrics (T-010) ─────────────────────────────

  async getMetrics() {
    const [statusCounts, mrrData, totalTx, trialExpiring7d, trialExpiredOverdue] =
      await Promise.all([
        this.repository.countProvidersByStatus(),
        this.repository.calculateMrr(),
        this.repository.countTransactionsThisMonth(),
        this.repository.countTrialExpiring(7),
        this.repository.countTrialExpiredOverdue(),
      ]);

    const activeCount =
      (statusCounts['ACTIVE'] ?? 0) +
      (statusCounts['TRIAL_ACTIVE'] ?? 0);

    return {
      metrics: {
        tenantsActive: statusCounts['ACTIVE'] ?? 0,
        tenantsTrial: statusCounts['TRIAL_ACTIVE'] ?? 0,
        tenantsSuspendedFull: statusCounts['SUSPENDED_SAAS_FULL'] ?? 0,
        tenantsSuspendedAuthOnly: statusCounts['SUSPENDED_SAAS_AUTH_ONLY'] ?? 0,
        mrr: mrrData.mrr,
        mrrBreakdown: mrrData.breakdown,
        totalTransactionsMonth: totalTx,
        avgTransactionsPerTenant: activeCount > 0 ? Math.round(totalTx / activeCount) : 0,
        trialExpiringNext7Days: trialExpiring7d,
        trialExpiredOverdue,
      },
    };
  }

  // ── Providers (T-011, T-012) ─────────────────────

  async listProviders(input: {
    page: number;
    limit: number;
    status?: string;
    planId?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const { data, total } = await this.repository.listProviders({
      page: input.page,
      limit: input.limit,
      status: input.status as never,
      planId: input.planId,
      search: input.search,
      sortBy: input.sortBy === 'name' ? 'legalName' : input.sortBy,
      sortOrder: input.sortOrder.toLowerCase() as 'asc' | 'desc',
    });

    return {
      data: data.map((provider) => ({
        id: provider.id,
        legalName: provider.legalName,
        tradeName: provider.tradeName,
        cnpj: provider.cnpj,
        email: provider.email,
        status: provider.status,
        subscription: provider.subscription
          ? {
              id: provider.subscription.id,
              planId: provider.subscription.planId,
              planName: provider.subscription.plan.name,
              status: provider.subscription.status,
              trialEndsAt: provider.subscription.trialEndsAt,
              currentPeriodStart: provider.subscription.currentPeriodStart,
              currentPeriodEnd: provider.subscription.currentPeriodEnd,
            }
          : null,
        createdAt: provider.createdAt,
      })),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  }

  async getProviderDetail(id: string) {
    const provider = await this.repository.findProviderById(id);
    if (!provider) {
      throw new NotFoundException('Provider não encontrado');
    }

    const usage = await this.repository.getProviderUsageStats(id);

    return {
      provider: {
        id: provider.id,
        legalName: provider.legalName,
        tradeName: provider.tradeName,
        cnpj: provider.cnpj,
        email: provider.email,
        phone: provider.phone,
        status: provider.status,
        timezone: provider.timezone,
        address: provider.addressJson,
        geofence: {
          lat: provider.geofenceLat,
          lng: provider.geofenceLng,
          radiusM: provider.geofenceRadiusM,
        },
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      },
      subscription: provider.subscription
        ? {
            id: provider.subscription.id,
            planId: provider.subscription.planId,
            planName: provider.subscription.plan.name,
            baseMonthlyPrice: provider.subscription.plan.baseMonthlyPrice,
            status: provider.subscription.status,
            trialEndsAt: provider.subscription.trialEndsAt,
            currentPeriodStart: provider.subscription.currentPeriodStart,
            currentPeriodEnd: provider.subscription.currentPeriodEnd,
            cancelledAt: provider.subscription.cancelledAt,
            createdAt: provider.subscription.createdAt,
          }
        : null,
      usage,
      invoices: provider.subscription?.invoices.map((inv) => ({
        id: inv.id,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        totalAmount: inv.totalAmount,
        status: inv.status,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
      })) ?? [],
      users: provider.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        status: u.status,
        roles: u.roles.map((r) => r.role.name),
      })),
    };
  }

  // ── SaaS Plans CRUD (T-013) ─────────────────────

  async listSaasPlans(input: {
    page: number;
    limit: number;
    isActive?: boolean;
    sortBy: string;
    sortOrder: string;
  }) {
    const { data, total } = await this.repository.listSaasPlans({
      ...input,
      sortOrder: input.sortOrder.toLowerCase() as 'asc' | 'desc',
    });

    return {
      data,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  }

  async createSaasPlan(input: {
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
    actorUserId: string;
    ipAddress: string;
  }) {
    const existing = await this.repository.findSaasPlanByCode(input.code);
    if (existing) {
      throw new ConflictException(`Plano com código "${input.code}" já existe`);
    }

    const plan = await this.repository.createSaasPlan(input);

    await this.auditService.log({
      actorUserId: input.actorUserId,
      actorType: 'ACCEPTION_ADMIN',
      action: 'SAAS_PLAN_CREATED',
      entityType: 'SaasPlan',
      entityId: plan.id,
      details: { code: input.code, name: input.name },
      ipAddress: input.ipAddress,
    });

    return plan;
  }

  async updateSaasPlan(
    id: string,
    input: Record<string, unknown>,
    actorUserId: string,
    ipAddress: string,
  ) {
    const plan = await this.repository.findSaasPlanById(id);
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const updated = await this.repository.updateSaasPlan(id, input);

    await this.auditService.log({
      actorUserId,
      actorType: 'ACCEPTION_ADMIN',
      action: 'SAAS_PLAN_UPDATED',
      entityType: 'SaasPlan',
      entityId: id,
      details: { changes: input },
      ipAddress,
    });

    return updated;
  }

  async deleteSaasPlan(id: string, actorUserId: string, ipAddress: string) {
    const plan = await this.repository.findSaasPlanById(id);
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    await this.repository.deactivateSaasPlan(id);

    await this.auditService.log({
      actorUserId,
      actorType: 'ACCEPTION_ADMIN',
      action: 'SAAS_PLAN_DEACTIVATED',
      entityType: 'SaasPlan',
      entityId: id,
      details: { code: plan.code },
      ipAddress,
    });

    return { message: 'Plano desativado com sucesso', plan: { id, isActive: false } };
  }

  // ── Activate Subscription (T-014) ───────────────

  async activateSubscription(
    providerId: string,
    input: { planId: string; invoiceId?: string; notes?: string },
    actorUserId: string,
    ipAddress: string,
  ) {
    const provider = await this.repository.findProviderById(providerId);
    if (!provider) {
      throw new NotFoundException('Provider não encontrado');
    }

    const plan = await this.repository.findSaasPlanById(input.planId);
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const subscription = await this.repository.activateSubscription(providerId, input.planId);

    let invoice = null;
    if (input.invoiceId) {
      invoice = await this.repository.markInvoicePaid(input.invoiceId, new Date());
    }

    await this.auditService.log({
      providerId,
      actorUserId,
      actorType: 'ACCEPTION_ADMIN',
      action: 'SUBSCRIPTION_ACTIVATED',
      entityType: 'Subscription',
      entityId: subscription.id,
      details: { planId: input.planId, notes: input.notes },
      ipAddress,
    });

    return {
      message: 'Assinatura ativada',
      subscription: {
        id: subscription.id,
        providerId: subscription.providerId,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      invoice: invoice
        ? { id: invoice.id, status: invoice.status, paidAt: invoice.paidAt }
        : null,
    };
  }

  // ── Suspend Provider (T-015) ────────────────────

  async suspendProvider(
    providerId: string,
    input: { suspensionMode: string; reason: string; notes?: string },
    actorUserId: string,
    ipAddress: string,
  ) {
    const provider = await this.repository.findProviderById(providerId);
    if (!provider) {
      throw new NotFoundException('Provider não encontrado');
    }

    const mode =
      input.suspensionMode === 'BLOCK_AUTH_ONLY'
        ? ('SUSPENDED_SAAS_AUTH_ONLY' as const)
        : ('SUSPENDED_SAAS_FULL' as const);

    const result = await this.repository.suspendProvider(providerId, mode);

    await this.auditService.log({
      providerId,
      actorUserId,
      actorType: 'ACCEPTION_ADMIN',
      action: 'PROVIDER_SUSPENDED',
      entityType: 'Provider',
      entityId: providerId,
      details: { mode, reason: input.reason, notes: input.notes },
      ipAddress,
    });

    return {
      message: 'Provider suspenso',
      provider: { id: result.provider.id, status: result.provider.status },
      subscription: { status: 'SUSPENDED' },
    };
  }

  // ── Reactivate Provider (T-016) ─────────────────

  async reactivateProvider(
    providerId: string,
    input: { notes?: string },
    actorUserId: string,
    ipAddress: string,
  ) {
    const provider = await this.repository.findProviderById(providerId);
    if (!provider) {
      throw new NotFoundException('Provider não encontrado');
    }

    const result = await this.repository.reactivateProvider(providerId);

    await this.auditService.log({
      providerId,
      actorUserId,
      actorType: 'ACCEPTION_ADMIN',
      action: 'PROVIDER_REACTIVATED',
      entityType: 'Provider',
      entityId: providerId,
      details: { notes: input.notes },
      ipAddress,
    });

    return {
      message: 'Provider reativado',
      provider: { id: result.provider.id, status: result.provider.status },
      subscription: { status: 'ACTIVE' },
    };
  }

  // ── Mark Invoice Paid (T-019) ───────────────────

  async markInvoicePaid(
    invoiceId: string,
    input: { paidDate?: string; externalRef?: string; notes?: string },
    actorUserId: string,
    ipAddress: string,
  ) {
    const invoice = await this.repository.findSaasInvoiceById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice não encontrada');
    }

    const paidAt = input.paidDate ? new Date(input.paidDate) : new Date();
    const updated = await this.repository.markInvoicePaid(invoiceId, paidAt, input.externalRef);

    // Reactivate provider if suspended
    const provider = invoice.subscription.provider;
    if (
      provider.status === 'SUSPENDED_SAAS_FULL' ||
      provider.status === 'SUSPENDED_SAAS_AUTH_ONLY'
    ) {
      await this.repository.reactivateProvider(provider.id);
    }

    await this.auditService.log({
      providerId: invoice.providerId,
      actorUserId,
      actorType: 'ACCEPTION_ADMIN',
      action: 'SAAS_INVOICE_PAID',
      entityType: 'SaasInvoice',
      entityId: invoiceId,
      details: { externalRef: input.externalRef, notes: input.notes },
      ipAddress,
    });

    return {
      message: 'Invoice marcada como paga',
      invoice: {
        id: updated.id,
        providerId: updated.providerId,
        status: updated.status,
        paidAt: updated.paidAt,
        totalAmount: updated.totalAmount,
      },
      provider: {
        id: provider.id,
        status: 'ACTIVE',
      },
    };
  }

  // ── Audit Log (T-020) ──────────────────────────

  async listAuditLogs(input: {
    page: number;
    limit: number;
    providerId?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortOrder: string;
  }) {
    const { data, total } = await this.repository.listAuditLogs({
      page: input.page,
      limit: input.limit,
      providerId: input.providerId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      sortOrder: input.sortOrder.toLowerCase() as 'asc' | 'desc',
    });

    return {
      data: data.map((log) => ({
        id: log.id,
        providerId: log.providerId,
        actorUserId: log.actorUserId,
        actorType: log.actorType,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        detailsJson: log.detailsJson,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  }
}
