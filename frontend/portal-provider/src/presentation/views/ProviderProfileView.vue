<template>
  <v-container class="py-8">
    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        {{ t('views.myProvider.title') }}
        <v-spacer />
        <v-btn v-if="!editing" icon="mdi-pencil" variant="text" @click="startEdit" />
      </v-card-title>
      <v-card-text v-if="provider">
        <v-form v-if="editing" @submit.prevent="saveProfile">
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="form.tradeName" :label="t('views.providers.fields.tradeName')" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.legalName" :label="t('views.providers.fields.legalName')" /></v-col>
            <v-col cols="12" md="6"><v-text-field :model-value="provider.cnpj" :label="t('views.providers.fields.cnpj')" readonly disabled /></v-col>
            <v-col cols="12" md="6"><v-text-field :model-value="provider.email" :label="t('views.providers.fields.email')" readonly disabled /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.phone" :label="t('views.providers.fields.phone')" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.responsibleName" :label="t('views.providers.fields.responsibleName')" /></v-col>
          </v-row>
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="cancelEdit">{{ t('common.actions.cancel') }}</v-btn>
            <v-btn color="primary" :loading="saving" @click="saveProfile">{{ t('views.myProvider.save') }}</v-btn>
          </div>
        </v-form>

        <v-row v-else>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.tradeName') }}:</strong> {{ provider.tradeName }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.legalName') }}:</strong> {{ provider.legalName }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.cnpj') }}:</strong> {{ formatCnpj(provider.cnpj) }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.email') }}:</strong> {{ provider.email }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.phone') }}:</strong> {{ provider.phone || '-' }}</v-col>
          <v-col cols="12" md="6"><strong>{{ t('views.providers.fields.responsibleName') }}:</strong> {{ provider.responsibleName }}</v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProviderApi } from '../../infrastructure/http/ProviderApi';
import { useSnackbar } from '../../application/composables/useSnackbar';

interface Provider {
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string | null;
  responsibleName: string;
}

const { t } = useI18n();
const { notify } = useSnackbar();

const provider = ref<Provider | null>(null);
const editing = ref(false);
const saving = ref(false);
const form = reactive({
  legalName: '',
  tradeName: '',
  phone: '',
  responsibleName: '',
});

const loadProvider = async () => {
  const response = await ProviderApi.getMe();
  provider.value = response.data as Provider;
  Object.assign(form, {
    legalName: provider.value.legalName,
    tradeName: provider.value.tradeName,
    phone: provider.value.phone || '',
    responsibleName: provider.value.responsibleName,
  });
};

const startEdit = () => {
  editing.value = true;
};

const cancelEdit = () => {
  editing.value = false;
  if (provider.value) {
    Object.assign(form, {
      legalName: provider.value.legalName,
      tradeName: provider.value.tradeName,
      phone: provider.value.phone || '',
      responsibleName: provider.value.responsibleName,
    });
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    await ProviderApi.updateMe({
      legalName: form.legalName,
      tradeName: form.tradeName,
      phone: form.phone,
      responsibleName: form.responsibleName,
    });
    await loadProvider();
    editing.value = false;
    notify(t('views.myProvider.messages.updated'), 'success');
  } catch {
    notify(t('errors.default'), 'error');
  } finally {
    saving.value = false;
  }
};

const formatCnpj = (value: string) => value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

onMounted(loadProvider);
</script>
