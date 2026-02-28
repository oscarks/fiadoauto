<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12">
        <v-card rounded="xl" elevation="2">
          <v-card-title>{{ provider?.tradeName || '-' }}</v-card-title>
          <v-card-subtitle>
            <v-chip :color="statusColor(provider?.status)" variant="tonal">
              {{ provider ? t(`views.providers.status.${provider.status}`) : '-' }}
            </v-chip>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="4">
        <v-card rounded="xl" variant="tonal" color="primary">
          <v-card-title>{{ t('views.dashboard.activeUsers') }}</v-card-title>
          <v-card-text class="text-h5 font-weight-bold">{{ activeUsers }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="xl" variant="tonal" color="info">
          <v-card-title>{{ t('views.users.fields.lastLoginAt') }}</v-card-title>
          <v-card-text class="text-body-1">{{ lastLogin || '-' }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="xl" variant="tonal" color="success">
          <v-card-title>{{ t('views.dashboard.providerStatus') }}</v-card-title>
          <v-card-text class="text-body-1">{{ provider ? t(`views.providers.status.${provider.status}`) : '-' }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProviderApi } from '../../infrastructure/http/ProviderApi';
import { UserApi } from '../../infrastructure/http/UserApi';

interface Provider {
  tradeName: string;
  status: string;
}

interface UserItem {
  lastLoginAt: string | null;
}

interface UserListPayload {
  data: UserItem[];
  meta: {
    total: number;
  };
}

const { t } = useI18n();
const provider = ref<Provider | null>(null);
const activeUsers = ref(0);
const lastLogin = ref<string | null>(null);

const statusColor = (status?: string) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'TRIAL_ACTIVE') return 'warning';
  if (status === 'SUSPENDED' || status === 'PAST_DUE') return 'error';
  return 'info';
};

onMounted(async () => {
  const providerResponse = await ProviderApi.getMe();
  provider.value = providerResponse.data as Provider;

  const usersResponse = await UserApi.list({ page: 1, limit: 20, status: 'ACTIVE' });
  const payload = usersResponse.data as UserListPayload;
  activeUsers.value = payload.meta.total;
  const latest = payload.data.find((item) => item.lastLoginAt);
  lastLogin.value = latest?.lastLoginAt ? new Date(latest.lastLoginAt).toLocaleString('pt-BR') : null;
});
</script>
