<template>
  <v-container fluid class="fill-height login-container">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card elevation="8" class="pa-6">
          <v-card-title class="text-center mb-4 d-flex flex-column">
            <h1 class="text-h4 font-weight-bold">{{ t('common.appName') }}</h1>
            <p class="text-subtitle-1 text-medium-emphasis mt-2">{{ t('views.login.subtitle') }}</p>
          </v-card-title>

          <v-card-text>
            <v-form ref="formRef" v-model="formValid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                :label="t('views.login.emailLabel')"
                type="email"
                prepend-inner-icon="mdi-email"
                :rules="emailRules"
                :disabled="authStore.loading"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />

              <v-text-field
                v-model="password"
                :label="t('views.login.passwordLabel')"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="passwordRules"
                :disabled="authStore.loading"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />

              <v-alert
                v-if="authStore.error"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
                closable
              >
                {{ authStore.error }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="authStore.loading"
                :disabled="!formValid || authStore.loading"
              >
                {{ t('views.login.submit') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/application/stores/auth'
import { useSnackbar } from '@/application/composables/useSnackbar'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const snackbar = useSnackbar()

const formRef = ref()
const formValid = ref(false)
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const emailRules = [
  (v: string) => !!v || t('views.login.validation.emailRequired'),
  (v: string) => /.+@.+\..+/.test(v) || t('views.login.validation.emailInvalid'),
]

const passwordRules = [
  (v: string) => !!v || t('views.login.validation.passwordRequired'),
  (v: string) => v.length >= 6 || t('views.login.validation.passwordMin'),
]

async function handleLogin() {
  if (!formValid.value) return

  try {
    await authStore.login({ email: email.value, password: password.value })
    snackbar.show('Login realizado com sucesso.', 'success')

    const redirect = route.query.redirect
    const target = typeof redirect === 'string' ? redirect : '/'
    await router.push(target)
  } catch {
    snackbar.show('Falha ao autenticar.', 'error')
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f9fc 0%, #d8e2ef 100%);
}
</style>
