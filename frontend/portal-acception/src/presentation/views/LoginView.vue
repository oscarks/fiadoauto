<template>
  <v-container fluid class="login-container d-flex align-center justify-center">
    <v-card class="pa-6" min-width="340" max-width="420" width="100%" rounded="xl">
      <v-card-title class="text-h5">{{ t('views.login.title') }}</v-card-title>
      <v-card-subtitle>{{ t('views.login.subtitle') }}</v-card-subtitle>
      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-text-field
            v-model="email"
            type="email"
            :label="t('views.login.emailLabel')"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            class="mb-3"
            required
          />
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :label="t('views.login.passwordLabel')"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            variant="outlined"
            class="mb-2"
            required
          />

          <v-alert v-if="authStore.error" type="error" variant="tonal" class="mb-4">
            {{ authStore.error }}
          </v-alert>

          <v-btn type="submit" color="primary" block :loading="authStore.loading" class="mb-4">
            {{ t('views.login.submit') }}
          </v-btn>

          <router-link to="/forgot-password" class="text-decoration-none">
            {{ t('views.login.forgotPassword') }}
          </router-link>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../application/stores/auth';
import { useSnackbar } from '../../application/composables/useSnackbar';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const authStore = useAuthStore();
const { notify } = useSnackbar();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

const onSubmit = async () => {
  try {
    await authStore.login(email.value, password.value);
    notify(t('common.appName'), 'success');
    await router.push((route.query.redirect as string) || '/');
  } catch {
    notify(t('errors.login'), 'error');
  }
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
