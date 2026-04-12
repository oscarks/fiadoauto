import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ProviderApi, type RegisterProviderInput, type SaasPlan } from '@/infrastructure/http/ProviderApi'

export const useRegisterStore = defineStore('register', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)
  const plans = ref<SaasPlan[]>([])
  const plansLoading = ref(false)

  async function registerProvider(input: RegisterProviderInput) {
    loading.value = true
    error.value = null
    success.value = false

    try {
      await ProviderApi.register(input)
      success.value = true
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } }
      if (axiosError.response?.status === 409) {
        error.value = axiosError.response.data?.message ?? 'Dados já cadastrados no sistema.'
      } else if (axiosError.response?.status === 400) {
        error.value = axiosError.response.data?.message ?? 'Dados inválidos. Verifique os campos.'
      } else {
        error.value = 'Erro ao registrar. Tente novamente.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadPlans() {
    plansLoading.value = true
    try {
      const response = await ProviderApi.listPlans()
      plans.value = response.plans
    } catch {
      plans.value = []
    } finally {
      plansLoading.value = false
    }
  }

  function reset() {
    loading.value = false
    error.value = null
    success.value = false
  }

  return {
    loading,
    error,
    success,
    plans,
    plansLoading,
    registerProvider,
    loadPlans,
    reset,
  }
})
