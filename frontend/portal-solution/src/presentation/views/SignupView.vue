<template>
  <v-container fluid class="fill-height signup-container">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="10" md="8" lg="6" xl="5">
        <v-card elevation="8" class="pa-6">
          <v-card-title class="text-center mb-4 d-flex flex-column">
            <h1 class="text-h4 font-weight-bold">{{ t('views.signup.title') }}</h1>
            <p class="text-subtitle-1 text-medium-emphasis mt-2">{{ t('views.signup.subtitle') }}</p>
          </v-card-title>

          <v-card-text v-if="!registerStore.success">
            <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
              <h3 class="text-h6 mb-3">{{ t('views.signup.companySection') }}</h3>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.legalName"
                    :label="t('views.signup.legalName')"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.tradeName"
                    :label="t('views.signup.tradeName')"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.cnpj"
                    :label="t('views.signup.cnpj')"
                    :rules="[rules.required, rules.cnpj]"
                    variant="outlined"
                    density="comfortable"
                    maxlength="14"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.email"
                    :label="t('views.signup.companyEmail')"
                    type="email"
                    :rules="[rules.required, rules.email]"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
              </v-row>

              <v-text-field
                v-model="form.phone"
                :label="t('views.signup.phone')"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />

              <v-divider class="my-4" />
              <h3 class="text-h6 mb-3">{{ t('views.signup.adminSection') }}</h3>

              <v-text-field
                v-model="form.adminName"
                :label="t('views.signup.adminName')"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />

              <v-text-field
                v-model="form.adminEmail"
                :label="t('views.signup.adminEmail')"
                type="email"
                :rules="[rules.required, rules.email]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />

              <v-text-field
                v-model="form.adminPassword"
                :label="t('views.signup.adminPassword')"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[rules.required, rules.password]"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />

              <v-text-field
                v-model="confirmPassword"
                :label="t('views.signup.confirmPassword')"
                :type="showPassword ? 'text' : 'password'"
                :rules="[rules.required, rules.passwordMatch]"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />

              <v-checkbox
                v-model="form.acceptTerms"
                :label="t('views.signup.acceptTerms')"
                :rules="[rules.terms]"
                density="comfortable"
                class="mb-2"
              />

              <v-alert
                v-if="registerStore.error"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
                closable
              >
                {{ registerStore.error }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="registerStore.loading"
                :disabled="!formValid || registerStore.loading"
              >
                {{ t('views.signup.submit') }}
              </v-btn>

              <div class="text-center mt-4">
                <router-link to="/login" class="text-decoration-none">
                  {{ t('views.signup.alreadyHaveAccount') }}
                </router-link>
              </div>
            </v-form>
          </v-card-text>

          <v-card-text v-else class="text-center">
            <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
            <h2 class="text-h5 mb-2">{{ t('views.signup.successTitle') }}</h2>
            <p class="text-body-1">{{ t('views.signup.successMessage') }}</p>
            <v-btn color="primary" class="mt-4" to="/login">
              {{ t('views.signup.goToLogin') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegisterStore } from '@/application/stores/register'

const { t } = useI18n()
const registerStore = useRegisterStore()

const formRef = ref()
const formValid = ref(false)
const showPassword = ref(false)
const confirmPassword = ref('')

const form = reactive({
  legalName: '',
  tradeName: '',
  cnpj: '',
  email: '',
  phone: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  acceptTerms: false,
})

const rules = {
  required: (v: string | boolean) => (typeof v === 'boolean' ? v : !!v) || t('views.signup.validation.required'),
  email: (v: string) => /.+@.+\..+/.test(v) || t('views.signup.validation.emailInvalid'),
  cnpj: (v: string) => /^\d{14}$/.test(v.replace(/\D/g, '')) || t('views.signup.validation.cnpjInvalid'),
  password: (v: string) =>
    (/^.{8,}$/.test(v) && /[A-Z]/.test(v) && /\d/.test(v)) ||
    t('views.signup.validation.passwordWeak'),
  passwordMatch: (v: string) => v === form.adminPassword || t('views.signup.validation.passwordMismatch'),
  terms: (v: boolean) => v || t('views.signup.validation.termsRequired'),
}

async function handleSubmit() {
  if (!formValid.value) return

  try {
    await registerStore.registerProvider({
      legalName: form.legalName,
      tradeName: form.tradeName,
      cnpj: form.cnpj.replace(/\D/g, ''),
      email: form.email,
      phone: form.phone || undefined,
      admin: {
        name: form.adminName,
        email: form.adminEmail,
        password: form.adminPassword,
      },
      acceptTerms: form.acceptTerms,
    })
  } catch {
    // error is handled in store
  }
}

onUnmounted(() => {
  registerStore.reset()
})
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f9fc 0%, #d8e2ef 100%);
}
</style>
