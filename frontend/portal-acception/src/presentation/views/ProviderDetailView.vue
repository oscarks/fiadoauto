<template>
  <v-container class="py-8">
    <v-card v-if="provider">
      <v-card-title class="d-flex align-center ga-2">
        {{ provider.tradeName }}
        <v-spacer />
        <v-chip :color="statusColor(provider.status)" variant="tonal">
          {{ t(`views.providers.status.${provider.status}`) }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.legalName') }}:</strong> {{ provider.legalName }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.cnpj') }}:</strong> {{ formatCnpj(provider.cnpj) }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.email') }}:</strong> {{ provider.email }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.phone') }}:</strong> {{ provider.phone || '-' }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.responsibleName') }}:</strong> {{ provider.responsibleName }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.createdAt') }}:</strong> {{ formatDate(provider.createdAt) }}</v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-select
          v-model="newStatus"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          :label="t('views.providers.detail.changeStatus')"
          style="max-width: 260px"
        />
        <v-btn color="warning" @click="confirmDialog = true">
          {{ t('views.providers.detail.changeStatus') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="confirmDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('common.actions.confirm') }}</v-card-title>
        <v-card-text>
          {{ t('views.providers.detail.confirmStatusChange', { status: newStatus }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="warning" :loading="submitting" @click="changeStatus">{{ t('common.actions.confirm') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ProviderApi } from '../../infrastructure/http/ProviderApi';
import { useSnackbar } from '../../application/composables/useSnackbar';

interface ProviderDetail {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string | null;
  responsibleName: string;
  status: string;
  createdAt: string;
}

const route = useRoute();
const { t } = useI18n();
const { notify } = useSnackbar();

const provider = ref<ProviderDetail | null>(null);
const confirmDialog = ref(false);
const submitting = ref(false);
const newStatus = ref('ACTIVE');

const statusOptions = computed(() => [
  { label: t('views.providers.status.PENDING_VERIFICATION'), value: 'PENDING_VERIFICATION' },
  { label: t('views.providers.status.TRIAL_ACTIVE'), value: 'TRIAL_ACTIVE' },
  { label: t('views.providers.status.ACTIVE'), value: 'ACTIVE' },
  { label: t('views.providers.status.PAST_DUE'), value: 'PAST_DUE' },
  { label: t('views.providers.status.SUSPENDED'), value: 'SUSPENDED' },
  { label: t('views.providers.status.CANCELED'), value: 'CANCELED' },
]);

const fetchProvider = async () => {
  const response = await ProviderApi.getById(route.params.id as string);
  provider.value = response.data as ProviderDetail;
  newStatus.value = provider.value.status;
};

const changeStatus = async () => {
  submitting.value = true;
  try {
    await ProviderApi.changeStatus(route.params.id as string, newStatus.value);
    confirmDialog.value = false;
    notify(t('views.providers.messages.statusUpdated'), 'success');
    await fetchProvider();
  } catch {
    notify(t('errors.default'), 'error');
  } finally {
    submitting.value = false;
  }
};

const formatDate = (value: string) => new Date(value).toLocaleString('pt-BR');
const formatCnpj = (value: string) => value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
const statusColor = (status: string) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'TRIAL_ACTIVE') return 'warning';
  if (status === 'SUSPENDED' || status === 'PAST_DUE') return 'error';
  return 'info';
};

onMounted(fetchProvider);
</script>
