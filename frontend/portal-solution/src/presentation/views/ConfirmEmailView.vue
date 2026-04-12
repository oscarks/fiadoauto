<template>
  <v-container fluid class="fill-height auth-container">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card elevation="8" class="pa-6 text-center">
          <v-progress-circular v-if="loading" indeterminate color="primary" size="64" class="mb-4" />

          <template v-if="!loading && success">
            <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
            <h2 class="text-h5 mb-2">{{ t('views.confirmEmail.successTitle') }}</h2>
            <p class="text-body-1">{{ t('views.confirmEmail.successMessage') }}</p>
            <v-btn color="primary" class="mt-4" to="/login">
              {{ t('views.confirmEmail.goToLogin') }}
            </v-btn>
          </template>

          <template v-if="!loading && error">
            <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
            <h2 class="text-h5 mb-2">{{ t('views.confirmEmail.errorTitle') }}</h2>
            <p class="text-body-1">{{ error }}</p>
            <v-btn color="primary" class="mt-4" to="/login">
              {{ t('views.confirmEmail.goToLogin') }}
            </v-btn>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ProviderApi } from '@/infrastructure/http/ProviderApi'

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const success = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  const token = route.query.token as string

  if (!token) {
    error.value = t('views.confirmEmail.noToken')
    loading.value = false
    return
  }

  try {
    await ProviderApi.confirmEmail(token)
    success.value = true
  } catch {
    error.value = t('views.confirmEmail.invalidToken')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f9fc 0%, #d8e2ef 100%);
}
</style>
