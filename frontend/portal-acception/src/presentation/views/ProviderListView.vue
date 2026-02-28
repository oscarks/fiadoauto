<template>
  <v-container class="py-8">
    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        {{ t('views.providers.title') }}
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          {{ t('views.providers.newProvider') }}
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="search"
              :label="t('common.actions.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              @keyup.enter="fetchProviders"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              :label="t('views.providers.fields.status')"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="fetchProviders"
            />
          </v-col>
        </v-row>

        <v-table>
          <thead>
            <tr>
              <th>{{ t('views.providers.fields.tradeName') }}</th>
              <th>{{ t('views.providers.fields.cnpj') }}</th>
              <th>{{ t('views.providers.fields.status') }}</th>
              <th>{{ t('views.providers.fields.createdAt') }}</th>
              <th>{{ t('common.actions.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in providers" :key="item.id">
              <td>{{ item.tradeName }}</td>
              <td>{{ formatCnpj(item.cnpj) }}</td>
              <td>
                <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                  {{ t(`views.providers.status.${item.status}`) }}
                </v-chip>
              </td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <v-btn size="small" icon="mdi-eye" variant="text" @click="goToDetail(item.id)" />
              </td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex justify-end mt-4">
          <v-pagination v-model="page" :length="totalPages" @update:model-value="fetchProviders" />
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="createDialog" max-width="760">
      <v-card>
        <v-card-title>{{ t('views.providers.create.title') }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createProvider">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.legalName" :label="t('views.providers.fields.legalName')" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.tradeName" :label="t('views.providers.fields.tradeName')" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.cnpj" :label="t('views.providers.fields.cnpj')" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.email" :label="t('views.providers.fields.email')" type="email" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.phone" :label="t('views.providers.fields.phone')" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.responsibleName" :label="t('views.providers.fields.responsibleName')" required />
              </v-col>
              <v-col cols="12">
                <v-divider class="my-2" />
                <div class="text-subtitle-2 mb-2">{{ t('views.providers.create.addressSection') }}</div>
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field v-model="form.address.street" :label="t('views.providers.fields.street')" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.address.number" :label="t('views.providers.fields.number')" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.address.complement" :label="t('views.providers.fields.complement')" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.address.neighborhood" :label="t('views.providers.fields.neighborhood')" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.address.zipCode" :label="t('views.providers.fields.zipCode')" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.address.city" :label="t('views.providers.fields.city')" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.address.state" :label="t('views.providers.fields.state')" required />
              </v-col>
              <v-col cols="12">
                <v-divider class="my-2" />
                <div class="text-subtitle-2 mb-2">{{ t('views.providers.create.adminSection') }}</div>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.adminName" :label="t('views.users.fields.name')" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.adminEmail" :label="t('views.users.fields.email')" type="email" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.adminPassword" :label="t('views.login.passwordLabel')" type="password" required />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="primary" :loading="submitting" @click="createProvider">{{ t('common.actions.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ProviderApi } from '../../infrastructure/http/ProviderApi';
import { useSnackbar } from '../../application/composables/useSnackbar';

interface ProviderItem {
  id: string;
  tradeName: string;
  cnpj: string;
  status: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    totalPages: number;
  };
}

const { t } = useI18n();
const router = useRouter();
const { notify } = useSnackbar();

const providers = ref<ProviderItem[]>([]);
const page = ref(1);
const limit = 20;
const totalPages = ref(1);
const search = ref('');
const statusFilter = ref<string | null>(null);
const createDialog = ref(false);
const submitting = ref(false);

const statusOptions = computed(() => [
  { label: t('views.providers.status.TRIAL_ACTIVE'), value: 'TRIAL_ACTIVE' },
  { label: t('views.providers.status.ACTIVE'), value: 'ACTIVE' },
  { label: t('views.providers.status.SUSPENDED'), value: 'SUSPENDED' },
  { label: t('views.providers.status.PAST_DUE'), value: 'PAST_DUE' },
  { label: t('views.providers.status.CANCELED'), value: 'CANCELED' },
  { label: t('views.providers.status.PENDING_VERIFICATION'), value: 'PENDING_VERIFICATION' },
]);

const form = reactive({
  legalName: '',
  tradeName: '',
  cnpj: '',
  email: '',
  phone: '',
  responsibleName: '',
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  },
  adminName: '',
  adminEmail: '',
  adminPassword: '',
});

const fetchProviders = async () => {
  const response = await ProviderApi.list({
    page: page.value,
    limit,
    status: statusFilter.value || undefined,
    search: search.value || undefined,
  });

  const payload = response.data as PaginatedResponse<ProviderItem>;
  providers.value = payload.data;
  totalPages.value = payload.meta.totalPages || 1;
};

const openCreateDialog = () => {
  createDialog.value = true;
};

const validateCnpj = (value: string) => {
  const cnpj = value.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const calc = (base: string, factors: number[]) => {
    const sum = base
      .split('')
      .reduce((acc, d, idx) => acc + Number(d) * (factors[idx] ?? 0), 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const f1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const f2 = [6, ...f1];
  const d1 = calc(cnpj.slice(0, 12), f1);
  const d2 = calc(`${cnpj.slice(0, 12)}${d1}`, f2);

  return cnpj.endsWith(`${d1}${d2}`);
};

const createProvider = async () => {
  if (!validateCnpj(form.cnpj)) {
    notify(t('validation.cnpjInvalid'), 'error');
    return;
  }

  submitting.value = true;
  try {
    await ProviderApi.create({
      legalName: form.legalName,
      tradeName: form.tradeName,
      cnpj: form.cnpj,
      email: form.email,
      phone: form.phone || undefined,
      responsibleName: form.responsibleName,
      address: form.address,
      adminUser: {
        email: form.adminEmail,
        name: form.adminName,
        password: form.adminPassword,
      },
    });

    createDialog.value = false;
    Object.assign(form, {
      legalName: '',
      tradeName: '',
      cnpj: '',
      email: '',
      phone: '',
      responsibleName: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    });
    Object.assign(form.address, {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    });
    notify(t('views.providers.messages.created'), 'success');
    await fetchProviders();
  } catch {
    notify(t('errors.default'), 'error');
  } finally {
    submitting.value = false;
  }
};

const goToDetail = async (id: string) => {
  await router.push(`/providers/${id}`);
};

const formatDate = (value: string) => new Date(value).toLocaleString('pt-BR');
const formatCnpj = (value: string) => value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
const statusColor = (status: string) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'TRIAL_ACTIVE') return 'warning';
  if (status === 'SUSPENDED' || status === 'PAST_DUE') return 'error';
  return 'info';
};

onMounted(fetchProviders);
</script>
