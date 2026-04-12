<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 font-weight-bold">{{ t('views.plans.title') }}</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        {{ t('views.plans.create') }}
      </v-btn>
    </div>

    <v-data-table-server
      :headers="headers"
      :items="adminStore.plans"
      :items-length="adminStore.plansTotal"
      :loading="adminStore.plansLoading"
      :items-per-page="20"
    >
      <template #item.baseMonthlyPrice="{ item }">
        R$ {{ Number(item.baseMonthlyPrice).toFixed(2) }}
      </template>
      <template #item.isActive="{ item }">
        <v-chip :color="item.isActive ? 'success' : 'grey'" size="small" label>
          {{ item.isActive ? 'Ativo' : 'Inativo' }}
        </v-chip>
      </template>
      <template #item.maxConvenios="{ item }">
        {{ item.maxConvenios ?? 'Ilimitado' }}
      </template>
      <template #item.maxVehicles="{ item }">
        {{ item.maxVehicles ?? 'Ilimitado' }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon size="small" variant="text" @click="openEdit(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="error" @click="handleDelete(item.id)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table-server>

    <!-- Plan Form Dialog -->
    <v-dialog v-model="dialogOpen" max-width="600">
      <v-card>
        <v-card-title>{{ editingPlan ? t('views.plans.edit') : t('views.plans.create') }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-text-field v-model="form.name" label="Nome" :rules="[v => !!v || 'Obrigatorio']" variant="outlined" density="comfortable" class="mb-2" />
            <v-text-field v-model="form.code" label="Codigo" :rules="[v => !!v || 'Obrigatorio']" :disabled="!!editingPlan" variant="outlined" density="comfortable" class="mb-2" />
            <v-text-field v-model.number="form.baseMonthlyPrice" label="Preco Mensal (R$)" type="number" :rules="[v => v >= 0 || 'Valor invalido']" variant="outlined" density="comfortable" class="mb-2" />

            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="form.maxConvenios" label="Max Conveniados" type="number" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.maxVehicles" label="Max Veiculos" type="number" variant="outlined" density="comfortable" />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="form.maxTransactionsMonth" label="Max Tx/Mes" type="number" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.trialDays" label="Dias Trial" type="number" variant="outlined" density="comfortable" />
              </v-col>
            </v-row>

            <v-select v-model="form.whitelabelType" :items="['NONE', 'SUBDOMAIN', 'CUSTOM_DOMAIN']" label="Whitelabel" variant="outlined" density="comfortable" class="mb-2" />
            <v-select v-model="form.suspensionMode" :items="['FULL_BLOCK', 'BLOCK_AUTH_ONLY']" label="Modo Suspensao" variant="outlined" density="comfortable" class="mb-2" />

            <v-alert v-if="adminStore.actionError" type="error" variant="tonal" density="compact" class="mb-4" closable>
              {{ adminStore.actionError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialogOpen = false">{{ t('common.actions.close') }}</v-btn>
          <v-btn color="primary" :loading="adminStore.actionLoading" :disabled="!formValid" @click="handleSave">
            {{ t('views.plans.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/application/stores/admin'
import { useSnackbar } from '@/application/composables/useSnackbar'
import type { SaasPlan } from '@/infrastructure/http/AdminApi'

const { t } = useI18n()
const adminStore = useAdminStore()
const snackbar = useSnackbar()

const dialogOpen = ref(false)
const editingPlan = ref<SaasPlan | null>(null)
const formRef = ref()
const formValid = ref(false)

const form = reactive({
  name: '',
  code: '',
  baseMonthlyPrice: 0,
  maxConvenios: null as number | null,
  maxVehicles: null as number | null,
  maxTransactionsMonth: null as number | null,
  trialDays: 14,
  whitelabelType: 'NONE',
  suspensionMode: 'FULL_BLOCK',
})

const headers = [
  { title: 'Nome', key: 'name' },
  { title: 'Codigo', key: 'code' },
  { title: 'Preco/Mes', key: 'baseMonthlyPrice' },
  { title: 'Max Conv.', key: 'maxConvenios' },
  { title: 'Max Veic.', key: 'maxVehicles' },
  { title: 'Status', key: 'isActive' },
  { title: '', key: 'actions', sortable: false, width: 100 },
]

function openCreate() {
  editingPlan.value = null
  Object.assign(form, { name: '', code: '', baseMonthlyPrice: 0, maxConvenios: null, maxVehicles: null, maxTransactionsMonth: null, trialDays: 14, whitelabelType: 'NONE', suspensionMode: 'FULL_BLOCK' })
  dialogOpen.value = true
}

function openEdit(plan: SaasPlan) {
  editingPlan.value = plan
  Object.assign(form, {
    name: plan.name, code: plan.code, baseMonthlyPrice: Number(plan.baseMonthlyPrice),
    maxConvenios: plan.maxConvenios, maxVehicles: plan.maxVehicles, maxTransactionsMonth: plan.maxTransactionsMonth,
    trialDays: plan.trialDays, whitelabelType: plan.whitelabelType, suspensionMode: plan.suspensionMode,
  })
  dialogOpen.value = true
}

async function handleSave() {
  try {
    if (editingPlan.value) {
      await adminStore.updatePlan(editingPlan.value.id, { ...form } as Partial<SaasPlan>)
      snackbar.show('Plano atualizado', 'success')
    } else {
      await adminStore.createPlan({ ...form } as Partial<SaasPlan>)
      snackbar.show('Plano criado', 'success')
    }
    dialogOpen.value = false
    adminStore.loadPlans()
  } catch { /* handled in store */ }
}

async function handleDelete(id: string) {
  await adminStore.deletePlan(id)
  snackbar.show('Plano desativado', 'warning')
  adminStore.loadPlans()
}

onMounted(() => adminStore.loadPlans())
</script>
