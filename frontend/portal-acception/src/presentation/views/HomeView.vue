<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">{{ t('views.home.title') }}</v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-1">{{ t('views.home.welcome') }}</p>
            <p class="text-body-2 text-medium-emphasis">{{ authStore.user?.email }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/application/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
</script>
