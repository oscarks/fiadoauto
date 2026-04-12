<template>
  <v-container>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4" @click="router.push({ name: 'providers' })">
      {{ t('views.providerDetail.back') }}
    </v-btn>

    <v-progress-linear v-if="adminStore.providerDetailLoading" indeterminate color="primary" class="mb-4" />

    <template v-if="detail">
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <span>{{ detail.provider.tradeName }}</span>
              <v-spacer />
              <v-chip :color="statusColor(detail.provider.status)" label>{{ detail.provider.status }}</v-chip>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6"><strong>{{ t('views.providerDetail.legalName') }}:</strong> {{ detail.provider.legalName }}</v-col>
                <v-col cols="6"><strong>CNPJ:</strong> {{ detail.provider.cnpj }}</v-col>
                <v-col cols="6"><strong>Email:</strong> {{ detail.provider.email }}</v-col>
                <v-col cols="6"><strong>{{ t('views.providerDetail.phone') }}:</strong> {{ detail.provider.phone ?? '-' }}</v-col>
                <v-col cols="6"><strong>{{ t('views.providerDetail.created') }}:</strong> {{ new Date(detail.provider.createdAt).toLocaleDateString('pt-BR') }}</v-col>
                <v-col cols="6"><strong>Timezone:</strong> {{ detail.provider.timezone }}</v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Subscription -->
          <v-card class="mb-4">
            <v-card-title>{{ t('views.providerDetail.subscription') }}</v-card-title>
            <v-card-text v-if="detail.subscription">
              <v-row>
                <v-col cols="6"><strong>{{ t('views.providerDetail.plan') }}:</strong> {{ detail.subscription.planName }}</v-col>
                <v-col cols="6"><strong>Status:</strong> {{ detail.subscription.status }}</v-col>
                <v-col cols="6"><strong>{{ t('views.providerDetail.price') }}:</strong> R$ {{ Number(detail.subscription.baseMonthlyPrice).toFixed(2) }}</v-col>
                <v-col cols="6" v-if="detail.subscription.trialEndsAt">
                  <strong>Trial {{ t('views.providerDetail.expiresAt') }}:</strong> {{ new Date(detail.subscription.trialEndsAt).toLocaleDateString('pt-BR') }}
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-text v-else class="text-medium-emphasis">{{ t('views.providerDetail.noSubscription') }}</v-card-text>
          </v-card>

          <!-- Invoices -->
          <v-card class="mb-4" v-if="detail.invoices.length > 0">
            <v-card-title>{{ t('views.providerDetail.invoices') }}</v-card-title>
            <v-data-table
              :headers="invoiceHeaders"
              :items="detail.invoices"
              density="compact"
            >
              <template #item.totalAmount="{ item }">R$ {{ Number(item.totalAmount).toFixed(2) }}</template>
              <template #item.status="{ item }">
                <v-chip :color="invoiceStatusColor(item.status)" size="small" label>{{ item.status }}</v-chip>
              </template>
              <template #item.dueDate="{ item }">{{ new Date(item.dueDate).toLocaleDateString('pt-BR') }}</template>
              <template #item.actions="{ item }">
                <v-btn v-if="item.status !== 'PAID'" size="small" color="success" variant="text" @click="handleMarkPaid(item.id)">
                  {{ t('views.providerDetail.markPaid') }}
                </v-btn>
              </template>
            </v-data-table>
          </v-card>

          <!-- Users -->
          <v-card>
            <v-card-title>{{ t('views.providerDetail.users') }}</v-card-title>
            <v-data-table :headers="userHeaders" :items="detail.users" density="compact">
              <template #item.roles="{ item }">{{ item.roles.join(', ') }}</template>
              <template #item.status="{ item }">
                <v-chip size="small" label>{{ item.status }}</v-chip>
              </template>
            </v-data-table>
          </v-card>
        </v-col>

        <!-- Actions Sidebar -->
        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-title>{{ t('views.providerDetail.actions') }}</v-card-title>
            <v-card-text>
              <v-alert v-if="adminStore.actionError" type="error" variant="tonal" density="compact" class="mb-4" closable>
                {{ adminStore.actionError }}
              </v-alert>

              <!-- Activate Subscription -->
              <div class="mb-4">
                <v-select
                  v-model="selectedPlanId"
                  :items="adminStore.plans"
                  item-title="name"
                  item-value="id"
                  :label="t('views.providerDetail.selectPlan')"
                  variant="outlined"
                  density="comfortable"
                />
                <v-btn color="success" block :loading="adminStore.actionLoading" :disabled="!selectedPlanId" @click="handleActivate">
                  {{ t('views.providerDetail.activateSubscription') }}
                </v-btn>
              </div>

              <v-divider class="my-4" />

              <!-- Suspend -->
              <div class="mb-4">
                <v-select
                  v-model="suspensionMode"
                  :items="['FULL_BLOCK', 'BLOCK_AUTH_ONLY']"
                  :label="t('views.providerDetail.suspensionMode')"
                  variant="outlined"
                  density="comfortable"
                />
                <v-text-field
                  v-model="suspendReason"
                  :label="t('views.providerDetail.reason')"
                  variant="outlined"
                  density="comfortable"
                  class="mt-2"
                />
                <v-btn color="error" block :loading="adminStore.actionLoading" :disabled="!suspendReason" @click="handleSuspend">
                  {{ t('views.providerDetail.suspend') }}
                </v-btn>
              </div>

              <v-divider class="my-4" />

              <!-- Reactivate -->
              <v-btn color="primary" block :loading="adminStore.actionLoading" @click="handleReactivate">
                {{ t('views.providerDetail.reactivate') }}
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Usage -->
          <v-card>
            <v-card-title>{{ t('views.providerDetail.usage') }}</v-card-title>
            <v-card-text>
              <div class="mb-2"><strong>{{ t('views.providerDetail.txMonth') }}:</strong> {{ detail.usage.transactionsThisMonth }}</div>
              <div class="mb-2"><strong>{{ t('views.providerDetail.convenios') }}:</strong> {{ detail.usage.activeConvenios }}</div>
              <div><strong>{{ t('views.providerDetail.vehicles') }}:</strong> {{ detail.usage.activeVehicles }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/application/stores/admin'
import { useSnackbar } from '@/application/composables/useSnackbar'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const snackbar = useSnackbar()

const selectedPlanId = ref('')
const suspensionMode = ref('FULL_BLOCK')
const suspendReason = ref('')

const detail = computed(() => adminStore.providerDetail)

const invoiceHeaders = [
  { title: t('views.providerDetail.invoicePeriod'), key: 'periodStart' },
  { title: t('views.providerDetail.invoiceAmount'), key: 'totalAmount' },
  { title: 'Status', key: 'status' },
  { title: t('views.providerDetail.invoiceDue'), key: 'dueDate' },
  { title: '', key: 'actions', sortable: false },
]

const userHeaders = [
  { title: t('views.providerDetail.userName'), key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Roles', key: 'roles' },
  { title: 'Status', key: 'status' },
]

function statusColor(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'success', TRIAL_ACTIVE: 'info', PENDING_VERIFICATION: 'warning',
    SUSPENDED_SAAS_FULL: 'error', SUSPENDED_SAAS_AUTH_ONLY: 'orange', CANCELLED: 'grey',
  }
  return map[status] ?? 'default'
}

function invoiceStatusColor(status: string) {
  const map: Record<string, string> = {
    PAID: 'success', OPEN: 'info', PAST_DUE: 'error', CANCELLED: 'grey',
  }
  return map[status] ?? 'default'
}

async function handleActivate() {
  try {
    await adminStore.activateSubscription(route.params.id as string, selectedPlanId.value)
    snackbar.show('Assinatura ativada com sucesso', 'success')
    await adminStore.loadProviderDetail(route.params.id as string)
  } catch { /* handled in store */ }
}

async function handleSuspend() {
  try {
    await adminStore.suspendProvider(route.params.id as string, suspensionMode.value, suspendReason.value)
    snackbar.show('Provider suspenso', 'warning')
    await adminStore.loadProviderDetail(route.params.id as string)
  } catch { /* handled in store */ }
}

async function handleReactivate() {
  try {
    await adminStore.reactivateProvider(route.params.id as string)
    snackbar.show('Provider reativado', 'success')
    await adminStore.loadProviderDetail(route.params.id as string)
  } catch { /* handled in store */ }
}

async function handleMarkPaid(invoiceId: string) {
  try {
    await adminStore.markInvoicePaid(invoiceId)
    snackbar.show('Invoice marcada como paga', 'success')
    await adminStore.loadProviderDetail(route.params.id as string)
  } catch { /* handled in store */ }
}

onMounted(() => {
  adminStore.loadProviderDetail(route.params.id as string)
  adminStore.loadPlans()
})
</script>
