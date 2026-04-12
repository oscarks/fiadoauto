import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  AdminApi,
  type ProviderSummary,
  type ProviderDetail,
  type SaasPlan,
  type AuditLogEntry,
  type Metrics,
} from '@/infrastructure/http/AdminApi'

export const useAdminStore = defineStore('admin', () => {
  // Metrics
  const metrics = ref<Metrics['metrics'] | null>(null)
  const metricsLoading = ref(false)

  // Providers
  const providers = ref<ProviderSummary[]>([])
  const providersTotal = ref(0)
  const providersLoading = ref(false)
  const providerDetail = ref<ProviderDetail | null>(null)
  const providerDetailLoading = ref(false)

  // Plans
  const plans = ref<SaasPlan[]>([])
  const plansTotal = ref(0)
  const plansLoading = ref(false)

  // Audit
  const auditLogs = ref<AuditLogEntry[]>([])
  const auditTotal = ref(0)
  const auditLoading = ref(false)

  // Action state
  const actionLoading = ref(false)
  const actionError = ref<string | null>(null)

  async function loadMetrics() {
    metricsLoading.value = true
    try {
      const response = await AdminApi.getMetrics()
      metrics.value = response.metrics
    } finally {
      metricsLoading.value = false
    }
  }

  async function loadProviders(params: Record<string, unknown> = {}) {
    providersLoading.value = true
    try {
      const response = await AdminApi.listProviders(params)
      providers.value = response.data
      providersTotal.value = response.pagination.total
    } finally {
      providersLoading.value = false
    }
  }

  async function loadProviderDetail(id: string) {
    providerDetailLoading.value = true
    try {
      providerDetail.value = await AdminApi.getProviderDetail(id)
    } finally {
      providerDetailLoading.value = false
    }
  }

  async function loadPlans(params: Record<string, unknown> = {}) {
    plansLoading.value = true
    try {
      const response = await AdminApi.listSaasPlans(params)
      plans.value = response.data
      plansTotal.value = response.pagination.total
    } finally {
      plansLoading.value = false
    }
  }

  async function createPlan(body: Partial<SaasPlan>) {
    actionLoading.value = true
    actionError.value = null
    try {
      await AdminApi.createSaasPlan(body)
    } catch (err: unknown) {
      actionError.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erro ao criar plano'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  async function updatePlan(id: string, body: Partial<SaasPlan>) {
    actionLoading.value = true
    actionError.value = null
    try {
      await AdminApi.updateSaasPlan(id, body)
    } catch (err: unknown) {
      actionError.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erro ao atualizar plano'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  async function deletePlan(id: string) {
    actionLoading.value = true
    try {
      await AdminApi.deleteSaasPlan(id)
    } finally {
      actionLoading.value = false
    }
  }

  async function activateSubscription(providerId: string, planId: string, notes?: string) {
    actionLoading.value = true
    actionError.value = null
    try {
      await AdminApi.activateSubscription(providerId, { planId, notes })
    } catch (err: unknown) {
      actionError.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erro ao ativar assinatura'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  async function suspendProvider(providerId: string, suspensionMode: string, reason: string, notes?: string) {
    actionLoading.value = true
    actionError.value = null
    try {
      await AdminApi.suspendProvider(providerId, { suspensionMode, reason, notes })
    } catch (err: unknown) {
      actionError.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erro ao suspender'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  async function reactivateProvider(providerId: string, notes?: string) {
    actionLoading.value = true
    actionError.value = null
    try {
      await AdminApi.reactivateProvider(providerId, { notes })
    } catch (err: unknown) {
      actionError.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erro ao reativar'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  async function markInvoicePaid(invoiceId: string, externalRef?: string, notes?: string) {
    actionLoading.value = true
    try {
      await AdminApi.markInvoicePaid(invoiceId, { externalRef, notes })
    } finally {
      actionLoading.value = false
    }
  }

  async function loadAuditLogs(params: Record<string, unknown> = {}) {
    auditLoading.value = true
    try {
      const response = await AdminApi.listAuditLogs(params)
      auditLogs.value = response.data
      auditTotal.value = response.pagination.total
    } finally {
      auditLoading.value = false
    }
  }

  return {
    metrics, metricsLoading, loadMetrics,
    providers, providersTotal, providersLoading, loadProviders,
    providerDetail, providerDetailLoading, loadProviderDetail,
    plans, plansTotal, plansLoading, loadPlans,
    createPlan, updatePlan, deletePlan,
    activateSubscription, suspendProvider, reactivateProvider, markInvoicePaid,
    auditLogs, auditTotal, auditLoading, loadAuditLogs,
    actionLoading, actionError,
  }
})
