<template>
  <v-container class="py-8">
    <v-card>
      <v-card-title>{{ t('views.auditLogs.title') }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field v-model="entity" :label="t('views.auditLogs.fields.entity')" density="comfortable" variant="outlined" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="action" :label="t('views.auditLogs.fields.action')" density="comfortable" variant="outlined" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="startDate" type="date" density="comfortable" variant="outlined" />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="endDate" type="date" density="comfortable" variant="outlined" />
          </v-col>
        </v-row>

        <v-table>
          <thead>
            <tr>
              <th>{{ t('views.auditLogs.fields.action') }}</th>
              <th>{{ t('views.auditLogs.fields.entity') }}</th>
              <th>{{ t('views.auditLogs.fields.user') }}</th>
              <th>{{ t('views.auditLogs.fields.date') }}</th>
              <th>{{ t('common.actions.detail') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td><v-chip size="small" variant="tonal">{{ log.action }}</v-chip></td>
              <td>{{ log.entity }}</td>
              <td>{{ log.userId || '-' }}</td>
              <td>{{ formatDate(log.createdAt) }}</td>
              <td><v-btn icon="mdi-eye" size="small" variant="text" @click="openDetail(log.id)" /></td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex justify-end mt-4">
          <v-pagination v-model="page" :length="totalPages" @update:model-value="fetchLogs" />
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="760">
      <v-card>
        <v-card-title>{{ t('views.auditLogs.detail.title') }}</v-card-title>
        <v-card-text v-if="detail">
          <div class="mb-2"><strong>{{ t('views.auditLogs.fields.action') }}:</strong> {{ detail.action }}</div>
          <div class="mb-2"><strong>{{ t('views.auditLogs.fields.entity') }}:</strong> {{ detail.entity }}</div>
          <div class="mb-2"><strong>{{ t('views.auditLogs.fields.user') }}:</strong> {{ detail.userId || '-' }}</div>
          <div class="mb-4"><strong>{{ t('views.auditLogs.fields.date') }}:</strong> {{ formatDate(detail.createdAt) }}</div>

          <v-card v-if="detail.oldValue" variant="outlined" class="mb-4">
            <v-card-title>{{ t('views.auditLogs.detail.oldValue') }}</v-card-title>
            <v-card-text><pre class="pre">{{ pretty(detail.oldValue) }}</pre></v-card-text>
          </v-card>

          <v-card v-if="detail.newValue" variant="outlined">
            <v-card-title>{{ t('views.auditLogs.detail.newValue') }}</v-card-title>
            <v-card-text><pre class="pre">{{ pretty(detail.newValue) }}</pre></v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AuditApi } from '../../infrastructure/http/AuditApi';

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  userId: string | null;
  createdAt: string;
  oldValue: unknown;
  newValue: unknown;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { totalPages: number };
}

const { t } = useI18n();
const logs = ref<AuditLogItem[]>([]);
const detail = ref<AuditLogItem | null>(null);
const detailDialog = ref(false);
const page = ref(1);
const totalPages = ref(1);
const entity = ref('');
const action = ref('');
const startDate = ref('');
const endDate = ref('');

const fetchLogs = async () => {
  const response = await AuditApi.list({
    page: page.value,
    limit: 20,
    entity: entity.value || undefined,
    action: action.value || undefined,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
  });

  const payload = response.data as PaginatedResponse<AuditLogItem>;
  logs.value = payload.data;
  totalPages.value = payload.meta.totalPages || 1;
};

const openDetail = async (id: string) => {
  const response = await AuditApi.getById(id);
  detail.value = response.data as AuditLogItem;
  detailDialog.value = true;
};

const formatDate = (value: string) => new Date(value).toLocaleString('pt-BR');
const pretty = (value: unknown) => JSON.stringify(value, null, 2);

onMounted(fetchLogs);
</script>

<style scoped>
.pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
