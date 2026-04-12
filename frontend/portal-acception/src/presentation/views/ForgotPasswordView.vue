<template>
  <v-container fluid class="fill-height auth-container">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card elevation="8" class="pa-6">
          <v-card-title class="text-center mb-4 d-flex flex-column">
            <h1 class="text-h5 font-weight-bold">{{ t('views.forgotPassword.title') }}</h1>
            <p class="text-subtitle-2 text-medium-emphasis mt-2">{{ t('views.forgotPassword.subtitle') }}</p>
          </v-card-title>

          <v-card-text v-if="!sent">
            <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
              <v-text-field
                v-model="email"
                :label="t('views.login.emailLabel')"
                type="email"
                prepend-inner-icon="mdi-email"
                :rules="emailRules"
                :disabled="loading"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />

              <v-btn type="submit" color="primary" size="large" block :loading="loading" :disabled="!formValid">
                {{ t('views.forgotPassword.submit') }}
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-text v-else class="text-center">
            <v-icon size="64" color="success" class="mb-4">mdi-email-check</v-icon>
            <p class="text-body-1">{{ t('views.forgotPassword.sentMessage') }}</p>
          </v-card-text>

          <v-card-actions class="justify-center">
            <router-link to="/login" class="text-decoration-none">{{ t('views.forgotPassword.backToLogin') }}</router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiClient } from '@/infrastructure/http/apiClient'

const { t } = useI18n()
const formRef = ref()
const formValid = ref(false)
const email = ref('')
const loading = ref(false)
const sent = ref(false)

const emailRules = [
  (v: string) => !!v || t('views.login.validation.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('views.login.validation.emailInvalid'),
]

async function handleSubmit() {
  if (!formValid.value) return
  loading.value = true
  try {
    await apiClient.post('/api/auth/forgot-password', { email: email.value })
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container { min-height: 100vh; background: linear-gradient(135deg, #f6f9fc 0%, #d8e2ef 100%); }
</style>
