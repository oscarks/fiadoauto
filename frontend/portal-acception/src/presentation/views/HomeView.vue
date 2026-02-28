<template>
  <v-container class="py-8">
    <v-row>
      <v-col v-for="card in cards" :key="card.key" cols="12" sm="6" md="3">
        <v-card rounded="xl" elevation="2" :color="card.color" variant="tonal">
          <v-card-title class="d-flex align-center ga-2">
            <v-icon :icon="card.icon" />
            <span>{{ card.label }}</span>
          </v-card-title>
          <v-card-text class="text-h5 font-weight-bold">{{ card.value }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProviderApi } from '../../infrastructure/http/ProviderApi';

interface Provider {
  status: string;
}

const { t } = useI18n();
const providers = ref<Provider[]>([]);

const cards = computed(() => {
  const total = providers.value.length;
  const active = providers.value.filter((item) => item.status === 'ACTIVE').length;
  const trial = providers.value.filter((item) => item.status === 'TRIAL_ACTIVE').length;
  const blocked = providers.value.filter((item) => ['SUSPENDED', 'PAST_DUE'].includes(item.status)).length;

  return [
    {
      key: 'total',
      label: t('views.dashboard.totalProviders'),
      value: total,
      icon: 'mdi-gas-station',
      color: 'primary',
    },
    {
      key: 'active',
      label: t('views.dashboard.activeProviders'),
      value: active,
      icon: 'mdi-check-circle',
      color: 'success',
    },
    {
      key: 'trial',
      label: t('views.dashboard.trialProviders'),
      value: trial,
      icon: 'mdi-clock-outline',
      color: 'warning',
    },
    {
      key: 'blocked',
      label: t('views.dashboard.blockedProviders'),
      value: blocked,
      icon: 'mdi-block-helper',
      color: 'error',
    },
  ];
});

onMounted(async () => {
  const response = await ProviderApi.list({ page: 1, limit: 100 });
  providers.value = (response.data.data as Provider[]) ?? [];
});
</script>
