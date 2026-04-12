<template>
  <v-dialog v-model="dialogVisible" max-width="480">
    <v-card>
      <v-card-title class="text-h6">{{ dialog.state.title }}</v-card-title>
      <v-card-text>{{ dialog.state.message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="dialog.close">{{ t('common.actions.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalDialog } from '@/application/composables/useGlobalDialog'

const { t } = useI18n()

const dialog = useGlobalDialog()

const dialogVisible = computed({
  get: () => dialog.state.visible,
  set: (value: boolean) => {
    if (!value) {
      dialog.close()
    }
  },
})
</script>
