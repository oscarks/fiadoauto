<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-title class="font-weight-bold">FiadoAuto</v-app-bar-title>
      <v-spacer />
      <v-btn variant="text" to="/login">{{ t('views.landing.login') }}</v-btn>
      <v-btn variant="outlined" to="/signup">{{ t('views.landing.signup') }}</v-btn>
    </v-app-bar>

    <v-main>
      <!-- Hero -->
      <v-container fluid class="hero-section py-16">
        <v-row justify="center" align="center">
          <v-col cols="12" md="8" lg="6" class="text-center">
            <h1 class="text-h3 font-weight-bold mb-4">{{ t('views.landing.heroTitle') }}</h1>
            <p class="text-h6 text-medium-emphasis mb-8">{{ t('views.landing.heroSubtitle') }}</p>
            <v-btn color="primary" size="x-large" to="/signup" class="mr-4">
              {{ t('views.landing.heroCta') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <!-- Plans -->
      <v-container class="py-12">
        <h2 class="text-h4 font-weight-bold text-center mb-8">{{ t('views.landing.plansTitle') }}</h2>

        <v-progress-linear v-if="registerStore.plansLoading" indeterminate color="primary" class="mb-4" />

        <v-row justify="center">
          <v-col v-for="plan in registerStore.plans" :key="plan.id" cols="12" sm="6" md="4">
            <v-card elevation="4" class="pa-4 text-center" height="100%">
              <v-card-title class="text-h5 font-weight-bold">{{ plan.name }}</v-card-title>
              <v-card-subtitle class="text-h4 font-weight-bold primary--text mt-2">
                R$ {{ Number(plan.baseMonthlyPrice).toFixed(2) }}
                <span class="text-subtitle-2 font-weight-regular">/{{ t('views.landing.month') }}</span>
              </v-card-subtitle>

              <v-card-text class="text-left mt-4">
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-check-circle" class="px-0">
                    {{ plan.features.maxConvenios ? `${plan.features.maxConvenios} conveniados` : 'Conveniados ilimitados' }}
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="px-0">
                    {{ plan.features.maxVehicles ? `${plan.features.maxVehicles} veiculos` : 'Veiculos ilimitados' }}
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="px-0">
                    {{ plan.features.maxTransactionsMonth ? `${plan.features.maxTransactionsMonth} transacoes/mes` : 'Transacoes ilimitadas' }}
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="px-0">
                    {{ plan.features.trialDays }} dias de trial
                  </v-list-item>
                  <v-list-item v-if="plan.features.whitelabelType !== 'NONE'" prepend-icon="mdi-check-circle" class="px-0">
                    White-label: {{ plan.features.whitelabelType === 'SUBDOMAIN' ? 'Subdominio' : 'Dominio customizado' }}
                  </v-list-item>
                </v-list>
              </v-card-text>

              <v-card-actions class="justify-center">
                <v-btn color="primary" variant="elevated" to="/signup">
                  {{ t('views.landing.choosePlan') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRegisterStore } from '@/application/stores/register'

const { t } = useI18n()
const registerStore = useRegisterStore()

onMounted(() => {
  registerStore.loadPlans()
})
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #1f4e79 0%, #2f6b9a 100%);
  color: white;
}
</style>
