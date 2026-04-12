<template>
  <v-snackbar
    v-model="snackbarVisible"
    :color="snackbar.state.type"
    location="top right"
    :timeout="snackbar.state.timeout"
  >
    {{ snackbar.state.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSnackbar } from '@/application/composables/useSnackbar'

const snackbar = useSnackbar()

const snackbarVisible = computed({
  get: () => snackbar.state.visible,
  set: (value: boolean) => {
    if (!value) {
      snackbar.close()
    }
  },
})
</script>
