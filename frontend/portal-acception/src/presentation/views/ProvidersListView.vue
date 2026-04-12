<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-4">{{ t('views.providers.title') }}</h1>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="search"
              :label="t('views.providers.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="debouncedLoad"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="statusFilter"
              :label="t('views.providers.status')"
              :items="statusOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="loadProviders"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-data-table-server
      :headers="headers"
      :items="adminStore.providers"
      :items-length="adminStore.providersTotal"
      :loading="adminStore.providersLoading"
      :items-per-page="itemsPerPage"
      :page="page"
      @update:page="page = $event; loadProviders()"
      @update:items-per-page="itemsPerPage = $event; loadProviders()"
    >
      <template #item.status="{ item }">
        <v-chip :color="statusColor(item.status)" size="small" label>
          {{ item.status }}
        </v-chip>
      </template>

      <template #item.subscription="{ item }">
        <span v-if="item.subscription">{{ item.subscription.planName }} ({{ item.subscription.status }})</span>
        <span v-else class="text-medium-emphasis">-</span>
      </template>

      <template #item.createdAt="{ item }">
        {{ new Date(item.createdAt).toLocaleDateString('pt-BR') }}
      </template>

      <template #item.actions="{ item }">
        <v-btn icon size="small" variant="text" @click="goToDetail(item.id)">
          <v-icon>mdi-eye</v-icon>
        </v-btn>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/application/stores/admin'

const { t } = useI18n()
const router = useRouter()
const adminStore = useAdminStore()

const page = ref(1)
const itemsPerPage = ref(20)
const search = ref('')
const statusFilter = ref<string | null>(null)

const statusOptions = [
  'PENDING_VERIFICATION', 'TRIAL_ACTIVE', 'ACTIVE',
  'SUSPENDED_SAAS_FULL', 'SUSPENDED_SAAS_AUTH_ONLY', 'CANCELLED',
]

const headers = [
  { title: t('views.providers.col.tradeName'), key: 'tradeName' },
  { title: t('views.providers.col.cnpj'), key: 'cnpj' },
  { title: t('views.providers.col.status'), key: 'status' },
  { title: t('views.providers.col.subscription'), key: 'subscription', sortable: false },
  { title: t('views.providers.col.createdAt'), key: 'createdAt' },
  { title: '', key: 'actions', sortable: false, width: 60 },
]

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadProviders, 400)
}

function loadProviders() {
  adminStore.loadProviders({
    page: page.value,
    limit: itemsPerPage.value,
    ...(search.value ? { search: search.value } : {}),
    ...(statusFilter.value ? { status: statusFilter.value } : {}),
  })
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'success',
    TRIAL_ACTIVE: 'info',
    PENDING_VERIFICATION: 'warning',
    SUSPENDED_SAAS_FULL: 'error',
    SUSPENDED_SAAS_AUTH_ONLY: 'orange',
    CANCELLED: 'grey',
  }
  return map[status] ?? 'default'
}

function goToDetail(id: string) {
  router.push({ name: 'provider-detail', params: { id } })
}

onMounted(loadProviders)
</script>
