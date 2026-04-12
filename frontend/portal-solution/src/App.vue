<template>
  <router-view />
  <GlobalSnackbar />
  <GlobalMessageDialog />
</template>

<script setup lang="ts">
import GlobalSnackbar from '@/presentation/components/common/GlobalSnackbar.vue'
import GlobalMessageDialog from '@/presentation/components/GlobalMessageDialog.vue'
</script>
