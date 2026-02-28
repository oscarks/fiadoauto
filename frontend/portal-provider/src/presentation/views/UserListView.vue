<template>
  <v-container class="py-8">
    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        {{ t('views.users.title') }}
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">{{ t('views.users.newUser') }}</v-btn>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" :label="t('common.actions.search')" variant="outlined" density="comfortable" @keyup.enter="fetchUsers" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="roleFilter" :items="roleOptions" item-title="label" item-value="value" :label="t('views.users.fields.role')" clearable variant="outlined" density="comfortable" @update:model-value="fetchUsers" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="statusFilter" :items="statusOptions" item-title="label" item-value="value" :label="t('views.users.fields.status')" clearable variant="outlined" density="comfortable" @update:model-value="fetchUsers" />
          </v-col>
        </v-row>

        <v-table>
          <thead>
            <tr>
              <th>{{ t('views.users.fields.name') }}</th>
              <th>{{ t('views.users.fields.email') }}</th>
              <th>{{ t('views.users.fields.role') }}</th>
              <th>{{ t('views.users.fields.status') }}</th>
              <th>{{ t('views.users.fields.lastLoginAt') }}</th>
              <th>{{ t('common.actions.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in users" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.email }}</td>
              <td><v-chip size="small" variant="tonal">{{ t(`views.users.roles.${item.role}`) }}</v-chip></td>
              <td>
                <v-chip size="small" :color="item.status === 'ACTIVE' ? 'success' : 'error'" variant="tonal">
                  {{ t(`views.users.statuses.${item.status}`) }}
                </v-chip>
              </td>
              <td>{{ item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('pt-BR') : '-' }}</td>
              <td>
                <v-btn size="small" icon="mdi-pencil" variant="text" @click="openEditDialog(item)" />
                <v-btn
                  size="small"
                  :icon="item.status === 'ACTIVE' ? 'mdi-lock' : 'mdi-lock-open'"
                  variant="text"
                  @click="confirmBlockToggle(item)"
                />
                <v-btn size="small" icon="mdi-account-off" color="error" variant="text" @click="confirmDeactivate(item)" />
              </td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex justify-end mt-4">
          <v-pagination v-model="page" :length="totalPages" @update:model-value="fetchUsers" />
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="createDialog" max-width="560">
      <v-card>
        <v-card-title>{{ t('views.users.newUser') }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createUser">
            <v-text-field v-model="createForm.name" :label="t('views.users.fields.name')" class="mb-2" required />
            <v-text-field v-model="createForm.email" type="email" :label="t('views.users.fields.email')" class="mb-2" required />
            <v-text-field v-model="createForm.password" type="password" :label="t('views.login.passwordLabel')" class="mb-2" required />
            <v-select v-model="createForm.role" :items="roleOptions" item-title="label" item-value="value" :label="t('views.users.fields.role')" required />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="primary" :loading="submitting" @click="createUser">{{ t('common.actions.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="560">
      <v-card>
        <v-card-title>{{ t('common.actions.save') }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="updateUser">
            <v-text-field v-model="editForm.name" :label="t('views.users.fields.name')" class="mb-2" required />
            <v-text-field v-model="editForm.email" :label="t('views.users.fields.email')" class="mb-2" readonly disabled />
            <v-select v-model="editForm.role" :items="roleOptions" item-title="label" item-value="value" :label="t('views.users.fields.role')" required />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="primary" :loading="submitting" @click="updateUser">{{ t('common.actions.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDialog" max-width="520">
      <v-card>
        <v-card-title>{{ t('common.actions.confirm') }}</v-card-title>
        <v-card-text>{{ confirmMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="warning" :loading="submitting" @click="runPendingAction">{{ t('common.actions.confirm') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { UserApi } from '../../infrastructure/http/UserApi';
import { useSnackbar } from '../../application/composables/useSnackbar';

type ActionKind = 'block' | 'unblock' | 'deactivate';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { totalPages: number };
}

const { t } = useI18n();
const { notify } = useSnackbar();

const users = ref<UserItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const search = ref('');
const roleFilter = ref<string | null>(null);
const statusFilter = ref<string | null>(null);
const createDialog = ref(false);
const editDialog = ref(false);
const confirmDialog = ref(false);
const submitting = ref(false);
const pendingAction = ref<{ kind: ActionKind; user: UserItem } | null>(null);

const createForm = reactive({
  name: '',
  email: '',
  password: '',
  role: 'PROVIDER_OPERATOR',
});

const editForm = reactive({
  id: '',
  name: '',
  email: '',
  role: 'PROVIDER_OPERATOR',
});

const roleOptions = computed(() => [
  { label: t('views.users.roles.PROVIDER_OPERATOR'), value: 'PROVIDER_OPERATOR' },
  { label: t('views.users.roles.PROVIDER_MANAGER'), value: 'PROVIDER_MANAGER' },
]);

const statusOptions = computed(() => [
  { label: t('views.users.statuses.ACTIVE'), value: 'ACTIVE' },
  { label: t('views.users.statuses.BLOCKED'), value: 'BLOCKED' },
]);

const confirmMessage = computed(() => {
  if (!pendingAction.value) return '';
  if (pendingAction.value.kind === 'deactivate') {
    return t('views.users.confirmDeactivate', { name: pendingAction.value.user.name });
  }
  if (pendingAction.value.kind === 'block') {
    return t('views.users.confirmBlock', { name: pendingAction.value.user.name });
  }
  return t('views.users.confirmUnblock', { name: pendingAction.value.user.name });
});

const fetchUsers = async () => {
  const response = await UserApi.list({
    page: page.value,
    limit: 20,
    search: search.value || undefined,
    role: roleFilter.value || undefined,
    status: statusFilter.value || undefined,
  });

  const payload = response.data as PaginatedResponse<UserItem>;
  users.value = payload.data;
  totalPages.value = payload.meta.totalPages || 1;
};

const resetCreateForm = () => {
  Object.assign(createForm, {
    name: '',
    email: '',
    password: '',
    role: 'PROVIDER_OPERATOR',
  });
};

const openCreateDialog = () => {
  resetCreateForm();
  createDialog.value = true;
};

const createUser = async () => {
  submitting.value = true;
  try {
    await UserApi.create({
      name: createForm.name,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
    });
    createDialog.value = false;
    notify(t('views.users.messages.created'), 'success');
    await fetchUsers();
  } catch {
    notify(t('errors.default'), 'error');
  } finally {
    submitting.value = false;
  }
};

const openEditDialog = (item: UserItem) => {
  Object.assign(editForm, {
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
  });
  editDialog.value = true;
};

const updateUser = async () => {
  submitting.value = true;
  try {
    await UserApi.update(editForm.id, {
      name: editForm.name,
      role: editForm.role,
    });
    editDialog.value = false;
    notify(t('views.users.messages.updated'), 'success');
    await fetchUsers();
  } catch {
    notify(t('errors.default'), 'error');
  } finally {
    submitting.value = false;
  }
};

const confirmBlockToggle = (item: UserItem) => {
  pendingAction.value = {
    kind: item.status === 'ACTIVE' ? 'block' : 'unblock',
    user: item,
  };
  confirmDialog.value = true;
};

const confirmDeactivate = (item: UserItem) => {
  pendingAction.value = { kind: 'deactivate', user: item };
  confirmDialog.value = true;
};

const runPendingAction = async () => {
  if (!pendingAction.value) return;

  submitting.value = true;
  try {
    if (pendingAction.value.kind === 'block') {
      await UserApi.block(pendingAction.value.user.id);
      notify(t('views.users.messages.blocked'), 'success');
    } else if (pendingAction.value.kind === 'unblock') {
      await UserApi.unblock(pendingAction.value.user.id);
      notify(t('views.users.messages.unblocked'), 'success');
    } else {
      await UserApi.deactivate(pendingAction.value.user.id);
      notify(t('views.users.messages.deactivated'), 'success');
    }
    confirmDialog.value = false;
    pendingAction.value = null;
    await fetchUsers();
  } catch {
    notify(t('errors.default'), 'error');
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchUsers);
</script>
