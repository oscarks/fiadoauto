import { apiClient } from './apiClient'

export interface RegisterProviderInput {
  legalName: string
  tradeName: string
  cnpj: string
  email: string
  phone?: string
  address?: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    zipCode: string
  }
  admin: {
    name: string
    email: string
    password: string
  }
  acceptTerms: boolean
}

export interface RegisterProviderResponse {
  provider: {
    id: string
    legalName: string
    tradeName: string
    cnpj: string
    email: string
    status: string
    createdAt: string
  }
  user: {
    id: string
    email: string
    name: string
    status: string
    actorType: string
    roles: string[]
  }
  message: string
}

export interface SaasPlanFeatures {
  maxConvenios: number | null
  maxVehicles: number | null
  maxTransactionsMonth: number | null
  extraTxPrice: number | null
  whitelabelType: string
  trialDays: number
  suspensionMode: string
  gracePeriodDays: number
}

export interface SaasPlan {
  id: string
  name: string
  code: string
  baseMonthlyPrice: number
  features: SaasPlanFeatures
  isActive: boolean
}

export const ProviderApi = {
  async register(input: RegisterProviderInput): Promise<RegisterProviderResponse> {
    const { data } = await apiClient.post<RegisterProviderResponse>('/api/providers/register', input)
    return data
  },

  async listPlans(): Promise<{ plans: SaasPlan[] }> {
    const { data } = await apiClient.get<{ plans: SaasPlan[] }>('/api/providers/plans')
    return data
  },

  async confirmEmail(token: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/api/auth/confirm-email', { token })
    return data
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/api/auth/forgot-password', { email })
    return data
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('/api/auth/reset-password', { token, newPassword })
    return data
  },
}
