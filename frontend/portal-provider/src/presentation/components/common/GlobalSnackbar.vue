<template>
  <v-snackbar
    v-model="state.show"
    :color="state.type"
    :timeout="state.timeout"
    location="top right"
  >
    {{ state.message }}

    <template #actions>
      <v-btn variant="text" @click="state.show = false">
        {{ t('common.actions.close') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSnackbar } from '../../../application/composables/useSnackbar';

const { state } = useSnackbar();
const { t } = useI18n();
</script>
