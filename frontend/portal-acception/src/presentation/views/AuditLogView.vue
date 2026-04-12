<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-4">{{ t('views.auditLog.title') }}</h1>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="filters.action"
              :label="t('views.auditLog.action')"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="debouncedLoad"
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="filters.entityType"
              :label="t('views.auditLog.entityType')"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="debouncedLoad"
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="filters.dateFrom"
              :label="t('views.auditLog.dateFrom')"
              type="date"
              variant="outlined"
              density="comfortable"
              @update:model-value="loadLogs"
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="filters.dateTo"
              :label="t('views.auditLog.dateTo')"
              type="date"
              variant="outlined"
              density="comfortable"
              @update:model-value="loadLogs"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-data-table-server
      :headers="headers"
      :items="adminStore.auditLogs"
      :items-length="adminStore.auditTotal"
      :loading="adminStore.auditLoading"
      :items-per-page="itemsPerPage"
      :page="page"
      @update:page="page = $event; loadLogs()"
      @update:items-per-page="itemsPerPage = $event; loadLogs()"
    >
      <template #item.createdAt="{ item }">
        {{ new Date(item.createdAt).toLocaleString('pt-BR') }}
      </template>
      <template #item.action="{ item }">
        <v-chip size="small" label>{{ item.action }}</v-chip>
      </template>
      <template #item.detailsJson="{ item }">
        <span class="text-truncate d-inline-block" style="max-width: 200px">
          {{ JSON.stringify(item.detailsJson) }}
        </span>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/application/stores/admin'

const { t } = useI18n()
const adminStore = useAdminStore()

const page = ref(1)
const itemsPerPage = ref(50)
const filters = reactive({
  action: '',
  entityType: '',
  dateFrom: '',
  dateTo: '',
})

const headers = [
  { title: t('views.auditLog.col.date'), key: 'createdAt' },
  { title: t('views.auditLog.col.action'), key: 'action' },
  { title: t('views.auditLog.col.actorType'), key: 'actorType' },
  { title: t('views.auditLog.col.entityType'), key: 'entityType' },
  { title: t('views.auditLog.col.entityId'), key: 'entityId' },
  { title: t('views.auditLog.col.details'), key: 'detailsJson', sortable: false },
  { title: 'IP', key: 'ipAddress' },
]

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadLogs, 400)
}

function loadLogs() {
  const params: Record<string, unknown> = {
    page: page.value,
    limit: itemsPerPage.value,
  }
  if (filters.action) params.action = filters.action
  if (filters.entityType) params.entityType = filters.entityType
  if (filters.dateFrom) params.dateFrom = new Date(filters.dateFrom).toISOString()
  if (filters.dateTo) params.dateTo = new Date(filters.dateTo).toISOString()

  adminStore.loadAuditLogs(params)
}

onMounted(loadLogs)
</script>
