import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { AuthApi } from '@/infrastructure/http/AuthApi'
import type { AuthUser, LoginInput } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  const userRoles = computed(() => user.value?.roles ?? [])

  function setAuth(payload: { accessToken: string; refreshToken: string; user: AuthUser }) {
    accessToken.value = payload.accessToken
    refreshToken.value = payload.refreshToken
    user.value = payload.user

    localStorage.setItem('accessToken', payload.accessToken)
    localStorage.setItem('refreshToken', payload.refreshToken)
    localStorage.setItem('authUser', JSON.stringify(payload.user))
  }

  function clearAuth() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    error.value = null

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('authUser')
  }

  function loadStoredAuth() {
    const storedAccessToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('authUser')

    if (!storedAccessToken || !storedRefreshToken || !storedUser) {
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser) as AuthUser
      accessToken.value = storedAccessToken
      refreshToken.value = storedRefreshToken
      user.value = parsedUser
    } catch {
      clearAuth()
    }
  }

  async function login(input: LoginInput) {
    loading.value = true
    error.value = null

    try {
      const response = await AuthApi.login(input)
      setAuth(response)
    } catch {
      error.value = 'Nao foi possivel autenticar com as credenciais informadas.'
      throw new Error('login_failed')
    } finally {
      loading.value = false
    }
  }

  async function refreshSession() {
    if (!refreshToken.value) {
      return false
    }

    try {
      const response = await AuthApi.refresh(refreshToken.value)
      accessToken.value = response.accessToken
      refreshToken.value = response.refreshToken
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      return true
    } catch {
      clearAuth()
      return false
    }
  }

  async function logout() {
    try {
      await AuthApi.logout()
    } finally {
      clearAuth()
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    userRoles,
    setAuth,
    clearAuth,
    loadStoredAuth,
    login,
    refreshSession,
    logout,
  }
})
