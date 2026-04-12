import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from '../../../core/audit/application/audit.service';
import { BillingSaasRepository } from '../infrastructure/billing-saas.repository';

@Injectable()
export class BillingSaasService {
  private readonly logger = new Logger(BillingSaasService.name);

  constructor(
    private readonly repository: BillingSaasRepository,
    private readonly auditService: AuditService,
  ) {}

  // T-017: Job trial expirado — runs daily at 2:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleExpiredTrials() {
    this.logger.log('Running expired trials job...');

    const expiredTrials = await this.repository.findExpiredTrials();

    for (const subscription of expiredTrials) {
      try {
        await this.repository.expireTrialSubscription(
          subscription.id,
          subscription.providerId,
        );

        await this.auditService.log({
          providerId: subscription.providerId,
          actorType: 'SYSTEM',
          action: 'TRIAL_EXPIRED',
          entityType: 'Subscription',
          entityId: subscription.id,
          details: {
            planCode: subscription.plan.code,
            trialEndsAt: subscription.trialEndsAt,
          },
        });

        this.logger.log(
          `Trial expired for provider ${subscription.provider.tradeName} (${subscription.providerId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to expire trial for subscription ${subscription.id}: ${error}`,
        );
      }
    }

    this.logger.log(`Expired trials job completed. Processed: ${expiredTrials.length}`);
  }

  // T-018: Job invoice SaaS mensal — runs daily at 3:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleMonthlyInvoices() {
    this.logger.log('Running monthly invoice generation job...');

    const subscriptions = await this.repository.findActiveSubscriptionsForBilling();

    for (const subscription of subscriptions) {
      try {
        const periodStart = subscription.currentPeriodEnd!;
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const baseAmount = Number(subscription.plan.baseMonthlyPrice);

        // Calculate usage overage
        let usageAmount = 0;
        if (
          subscription.plan.maxTransactionsMonth &&
          subscription.plan.extraTxPrice
        ) {
          const txCount = await this.repository.countProviderTransactionsInPeriod(
            subscription.providerId,
            subscription.currentPeriodStart!,
            subscription.currentPeriodEnd!,
          );

          const overage = txCount - subscription.plan.maxTransactionsMonth;
          if (overage > 0) {
            usageAmount = overage * Number(subscription.plan.extraTxPrice);
          }
        }

        const totalAmount = baseAmount + usageAmount;
        const dueDate = new Date(periodStart);
        dueDate.setDate(dueDate.getDate() + 10);

        await this.repository.createSaasInvoice({
          providerId: subscription.providerId,
          subscriptionId: subscription.id,
          periodStart,
          periodEnd,
          baseAmount,
          usageAmount,
          totalAmount,
          dueDate,
        });

        await this.repository.advanceSubscriptionPeriod(
          subscription.id,
          periodStart,
          periodEnd,
        );

        await this.auditService.log({
          providerId: subscription.providerId,
          actorType: 'SYSTEM',
          action: 'SAAS_INVOICE_GENERATED',
          entityType: 'SaasInvoice',
          details: {
            planCode: subscription.plan.code,
            baseAmount,
            usageAmount,
            totalAmount,
          },
        });

        this.logger.log(
          `Invoice generated for provider ${subscription.provider.tradeName}: R$${totalAmount}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to generate invoice for subscription ${subscription.id}: ${error}`,
        );
      }
    }

    // Also handle overdue invoices
    await this.handleOverdueInvoices();

    this.logger.log(
      `Monthly invoice job completed. Processed: ${subscriptions.length}`,
    );
  }

  private async handleOverdueInvoices() {
    const overdueInvoices = await this.repository.findOverdueInvoices();

    for (const invoice of overdueInvoices) {
      try {
        await this.repository.markInvoiceOverdue(invoice.id);

        const gracePeriodDays = invoice.subscription.plan.gracePeriodDays;
        const dueDate = invoice.dueDate;
        const gracePeriodEnd = new Date(dueDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

        // If past grace period, suspend provider
        if (new Date() > gracePeriodEnd) {
          const suspensionMode = invoice.subscription.plan.suspensionMode;
          const providerStatus =
            suspensionMode === 'BLOCK_AUTH_ONLY'
              ? 'SUSPENDED_SAAS_AUTH_ONLY'
              : 'SUSPENDED_SAAS_FULL';

          await this.repository.suspendProviderForNonPayment(
            invoice.subscription.providerId,
            providerStatus,
          );

          await this.auditService.log({
            providerId: invoice.subscription.providerId,
            actorType: 'SYSTEM',
            action: 'PROVIDER_SUSPENDED_NON_PAYMENT',
            entityType: 'Provider',
            entityId: invoice.subscription.providerId,
            details: {
              invoiceId: invoice.id,
              suspensionMode: providerStatus,
            },
          });

          this.logger.warn(
            `Provider ${invoice.subscription.provider.tradeName} suspended for non-payment`,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to process overdue invoice ${invoice.id}: ${error}`);
      }
    }
  }
}
