<template>
  <v-container fluid class="login-container d-flex align-center justify-center">
    <v-card class="pa-6" min-width="340" max-width="420" width="100%" rounded="xl">
      <v-card-title class="text-h5">{{ t('views.forgotPassword.title') }}</v-card-title>
      <v-card-subtitle>{{ t('views.forgotPassword.subtitle') }}</v-card-subtitle>
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
          <v-btn type="submit" color="primary" block class="mb-3">{{ t('views.forgotPassword.submit') }}</v-btn>
          <v-alert v-if="success" type="success" variant="tonal" class="mb-3">
            {{ t('views.forgotPassword.success') }}
          </v-alert>
          <router-link to="/login" class="text-decoration-none">{{ t('common.actions.back') }}</router-link>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AuthApi } from '../../infrastructure/http/AuthApi';

const { t } = useI18n();
const email = ref('');
const success = ref(false);

const onSubmit = async () => {
  await AuthApi.forgotPassword(email.value);
  success.value = true;
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
