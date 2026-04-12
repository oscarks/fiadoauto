<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">{{ t('views.dashboard.title') }}</h1>

    <v-progress-linear v-if="adminStore.metricsLoading" indeterminate color="primary" class="mb-4" />

    <template v-if="adminStore.metrics">
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card color="success" variant="tonal" class="pa-4">
            <div class="text-subtitle-2">{{ t('views.dashboard.tenantsActive') }}</div>
            <div class="text-h4 font-weight-bold">{{ adminStore.metrics.tenantsActive }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card color="info" variant="tonal" class="pa-4">
            <div class="text-subtitle-2">{{ t('views.dashboard.tenantsTrial') }}</div>
            <div class="text-h4 font-weight-bold">{{ adminStore.metrics.tenantsTrial }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card color="warning" variant="tonal" class="pa-4">
            <div class="text-subtitle-2">{{ t('views.dashboard.tenantsSuspended') }}</div>
            <div class="text-h4 font-weight-bold">
              {{ adminStore.metrics.tenantsSuspendedFull + adminStore.metrics.tenantsSuspendedAuthOnly }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card color="primary" variant="tonal" class="pa-4">
            <div class="text-subtitle-2">{{ t('views.dashboard.mrr') }}</div>
            <div class="text-h4 font-weight-bold">R$ {{ adminStore.metrics.mrr.toFixed(2) }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" sm="6" md="4">
          <v-card class="pa-4">
            <div class="text-subtitle-2 text-medium-emphasis">{{ t('views.dashboard.totalTx') }}</div>
            <div class="text-h5 font-weight-bold">{{ adminStore.metrics.totalTransactionsMonth }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="pa-4">
            <div class="text-subtitle-2 text-medium-emphasis">{{ t('views.dashboard.trialExpiring') }}</div>
            <div class="text-h5 font-weight-bold text-warning">{{ adminStore.metrics.trialExpiringNext7Days }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-card class="pa-4">
            <div class="text-subtitle-2 text-medium-emphasis">{{ t('views.dashboard.trialExpired') }}</div>
            <div class="text-h5 font-weight-bold text-error">{{ adminStore.metrics.trialExpiredOverdue }}</div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/application/stores/admin'

const { t } = useI18n()
const adminStore = useAdminStore()

onMounted(() => {
  adminStore.loadMetrics()
})
</script>
