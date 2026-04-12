import { apiClient } from './apiClient'
import type { LoginInput, LoginResponse } from '@/types/auth'

export const AuthApi = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/api/auth/login', input)
    return data
  },

  async me() {
    const { data } = await apiClient.get('/api/auth/me')
    return data
  },

  async logout() {
    await apiClient.post('/api/auth/logout')
  },

  async refresh(refreshToken: string) {
    const { data } = await apiClient.post('/api/auth/refresh', { refreshToken })
    return data as { accessToken: string; refreshToken: string }
  },
}
