<template>
  <v-dialog v-model="state.show" max-width="500">
    <v-card>
      <v-card-title>{{ state.title }}</v-card-title>
      <v-card-text>{{ state.message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="text" @click="close">
          {{ t('common.actions.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useGlobalDialog } from '../../application/composables/useGlobalDialog';

const { state, close } = useGlobalDialog();
const { t } = useI18n();
</script>
