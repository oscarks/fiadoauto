<template>
  <v-container fluid class="fill-height auth-container">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card elevation="8" class="pa-6">
          <v-card-title class="text-center mb-4 d-flex flex-column">
            <h1 class="text-h5 font-weight-bold">{{ t('views.resetPassword.title') }}</h1>
          </v-card-title>

          <v-card-text v-if="!success">
            <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
              <v-text-field
                v-model="newPassword"
                :label="t('views.resetPassword.newPassword')"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="passwordRules"
                :disabled="loading"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />

              <v-text-field
                v-model="confirmPassword"
                :label="t('views.resetPassword.confirmPassword')"
                :type="showPassword ? 'text' : 'password'"
                :rules="[...passwordRules, matchRule]"
                :disabled="loading"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />

              <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4" closable>
                {{ error }}
              </v-alert>

              <v-btn type="submit" color="primary" size="large" block :loading="loading" :disabled="!formValid">
                {{ t('views.resetPassword.submit') }}
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-text v-else class="text-center">
            <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
            <p class="text-body-1">{{ t('views.resetPassword.successMessage') }}</p>
            <v-btn color="primary" class="mt-4" to="/login">
              {{ t('views.resetPassword.goToLogin') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ProviderApi } from '@/infrastructure/http/ProviderApi'

const { t } = useI18n()
const route = useRoute()

const formRef = ref()
const formValid = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const passwordRules = [
  (v: string) => !!v || t('views.resetPassword.validation.required'),
  (v: string) => v.length >= 8 || t('views.resetPassword.validation.minLength'),
  (v: string) => /[A-Z]/.test(v) || t('views.resetPassword.validation.uppercase'),
  (v: string) => /\d/.test(v) || t('views.resetPassword.validation.number'),
]

const matchRule = (v: string) => v === newPassword.value || t('views.resetPassword.validation.mismatch')

async function handleSubmit() {
  if (!formValid.value) return
  loading.value = true
  error.value = null

  const token = (route.query.token as string) ?? ''

  try {
    await ProviderApi.resetPassword(token, newPassword.value)
    success.value = true
  } catch {
    error.value = 'Token invalido ou expirado.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f9fc 0%, #d8e2ef 100%);
}
</style>
