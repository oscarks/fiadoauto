<template>
  <v-container fluid class="login-container d-flex align-center justify-center">
    <v-card class="pa-6" min-width="340" max-width="420" width="100%" rounded="xl">
      <v-card-title class="text-h5">{{ t('common.appName') }}</v-card-title>
      <v-card-text>
        <v-progress-circular v-if="loading" indeterminate color="primary" class="mb-3" />
        <div v-if="loading">{{ t('views.verifyEmail.verifying') }}</div>
        <v-alert v-else :type="success ? 'success' : 'error'" variant="tonal" class="mb-4">
          {{ success ? t('views.verifyEmail.success') : t('views.verifyEmail.error') }}
        </v-alert>
        <router-link to="/login" class="text-decoration-none">{{ t('views.verifyEmail.goToLogin') }}</router-link>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { AuthApi } from '../../infrastructure/http/AuthApi';

const route = useRoute();
const { t } = useI18n();
const loading = ref(true);
const success = ref(false);

onMounted(async () => {
  try {
    await AuthApi.verifyEmail(route.params.token as string);
    success.value = true;
  } catch {
    success.value = false;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, #9ad1c4 0%, transparent 45%),
    radial-gradient(circle at bottom left, #b7d6f8 0%, transparent 40%),
    linear-gradient(135deg, #f5faf8 0%, #edf4ff 100%);
}
</style>
