import { apiClient } from './apiClient'

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ProviderSummary {
  id: string
  legalName: string
  tradeName: string
  cnpj: string
  email: string
  status: string
  subscription: {
    id: string
    planId: string
    planName: string
    status: string
    trialEndsAt: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
  } | null
  createdAt: string
}

export interface ProviderDetail {
  provider: {
    id: string
    legalName: string
    tradeName: string
    cnpj: string
    email: string
    phone: string | null
    status: string
    timezone: string
    address: Record<string, string> | null
    geofence: { lat: number | null; lng: number | null; radiusM: number | null }
    createdAt: string
    updatedAt: string
  }
  subscription: {
    id: string
    planId: string
    planName: string
    baseMonthlyPrice: number
    status: string
    trialEndsAt: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelledAt: string | null
    createdAt: string
  } | null
  usage: {
    transactionsThisMonth: number
    activeConvenios: number
    activeVehicles: number
  }
  invoices: {
    id: string
    periodStart: string
    periodEnd: string
    totalAmount: number
    status: string
    dueDate: string
    paidAt: string | null
  }[]
  users: {
    id: string
    email: string
    name: string
    status: string
    roles: string[]
  }[]
}

export interface SaasPlan {
  id: string
  name: string
  code: string
  baseMonthlyPrice: number
  maxConvenios: number | null
  maxVehicles: number | null
  maxTransactionsMonth: number | null
  extraTxPrice: number | null
  whitelabelType: string
  trialDays: number
  trialMaxTransactions: number | null
  suspensionMode: string
  gracePeriodDays: number
  isActive: boolean
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  providerId: string | null
  actorUserId: string | null
  actorType: string
  action: string
  entityType: string
  entityId: string | null
  detailsJson: Record<string, unknown>
  ipAddress: string | null
  createdAt: string
}

export interface Metrics {
  metrics: {
    tenantsActive: number
    tenantsTrial: number
    tenantsSuspendedFull: number
    tenantsSuspendedAuthOnly: number
    mrr: number
    mrrBreakdown: { plan: string; amount: number; tenantCount: number }[]
    totalTransactionsMonth: number
    avgTransactionsPerTenant: number
    trialExpiringNext7Days: number
    trialExpiredOverdue: number
  }
}

export const AdminApi = {
  // Metrics
  async getMetrics(): Promise<Metrics> {
    const { data } = await apiClient.get<Metrics>('/api/admin/metrics')
    return data
  },

  // Providers
  async listProviders(params: Record<string, unknown> = {}): Promise<PaginatedResponse<ProviderSummary>> {
    const { data } = await apiClient.get<PaginatedResponse<ProviderSummary>>('/api/admin/providers', { params })
    return data
  },

  async getProviderDetail(id: string): Promise<ProviderDetail> {
    const { data } = await apiClient.get<ProviderDetail>(`/api/admin/providers/${id}`)
    return data
  },

  async activateSubscription(providerId: string, body: { planId: string; notes?: string }) {
    const { data } = await apiClient.post(`/api/admin/providers/${providerId}/activate-subscription`, body)
    return data
  },

  async suspendProvider(providerId: string, body: { suspensionMode: string; reason: string; notes?: string }) {
    const { data } = await apiClient.post(`/api/admin/providers/${providerId}/suspend`, body)
    return data
  },

  async reactivateProvider(providerId: string, body: { notes?: string } = {}) {
    const { data } = await apiClient.post(`/api/admin/providers/${providerId}/reactivate`, body)
    return data
  },

  // SaaS Plans
  async listSaasPlans(params: Record<string, unknown> = {}): Promise<PaginatedResponse<SaasPlan>> {
    const { data } = await apiClient.get<PaginatedResponse<SaasPlan>>('/api/admin/saas-plans', { params })
    return data
  },

  async createSaasPlan(body: Partial<SaasPlan>): Promise<SaasPlan> {
    const { data } = await apiClient.post<SaasPlan>('/api/admin/saas-plans', body)
    return data
  },

  async updateSaasPlan(id: string, body: Partial<SaasPlan>): Promise<SaasPlan> {
    const { data } = await apiClient.patch<SaasPlan>(`/api/admin/saas-plans/${id}`, body)
    return data
  },

  async deleteSaasPlan(id: string) {
    const { data } = await apiClient.delete(`/api/admin/saas-plans/${id}`)
    return data
  },

  // Invoices
  async markInvoicePaid(invoiceId: string, body: { externalRef?: string; notes?: string } = {}) {
    const { data } = await apiClient.post(`/api/admin/saas-invoices/${invoiceId}/mark-paid`, body)
    return data
  },

  // Audit Log
  async listAuditLogs(params: Record<string, unknown> = {}): Promise<PaginatedResponse<AuditLogEntry>> {
    const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>('/api/admin/audit-log', { params })
    return data
  },
}
