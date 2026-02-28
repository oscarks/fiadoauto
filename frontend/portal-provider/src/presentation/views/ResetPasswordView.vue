<template>
  <v-container fluid class="login-container d-flex align-center justify-center">
    <v-card class="pa-6" min-width="340" max-width="420" width="100%" rounded="xl">
      <v-card-title class="text-h5">{{ t('views.resetPassword.title') }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-text-field
            v-model="newPassword"
            type="password"
            :label="t('views.resetPassword.newPasswordLabel')"
            variant="outlined"
            class="mb-3"
            required
          />
          <v-text-field
            v-model="confirmPassword"
            type="password"
            :label="t('views.resetPassword.confirmPasswordLabel')"
            variant="outlined"
            class="mb-3"
            required
          />
          <v-btn type="submit" color="primary" block>{{ t('views.resetPassword.submit') }}</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { AuthApi } from '../../infrastructure/http/AuthApi';
import { useSnackbar } from '../../application/composables/useSnackbar';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { notify } = useSnackbar();

const newPassword = ref('');
const confirmPassword = ref('');

const hasStrongPassword = (value: string) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

const onSubmit = async () => {
  if (newPassword.value !== confirmPassword.value) {
    notify(t('validation.passwordMismatch'), 'error');
    return;
  }
  if (!hasStrongPassword(newPassword.value)) {
    notify(t('validation.passwordUppercase'), 'error');
    return;
  }

  await AuthApi.resetPassword(route.params.token as string, newPassword.value);
  notify(t('views.resetPassword.success'), 'success');
  await router.push('/login');
};
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
