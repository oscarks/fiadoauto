<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" color="grey-lighten-4">
      <v-list-item
        :title="authStore.user?.name || '-'"
        :subtitle="authStore.user?.email || '-'"
        prepend-icon="mdi-account-circle"
      />
      <v-divider class="my-2" />
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in filteredMenuItems"
          :key="item.to"
          :prepend-icon="item.icon"
          :title="t(item.titleKey)"
          :to="item.to"
          exact
          rounded="lg"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" density="comfortable">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>{{ t('layout.title') }}</v-toolbar-title>
      <v-spacer />
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon="mdi-account" variant="text" />
        </template>
        <v-list>
          <v-list-item :title="authStore.user?.name || '-'" :subtitle="authStore.user?.email || '-'" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" :title="t('layout.logout')" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <GlobalMessageDialog />
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import GlobalMessageDialog from '../components/GlobalMessageDialog.vue';
import { useAuthStore } from '../../application/stores/auth';

const drawer = ref(true);
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

const menuItems = [
  { titleKey: 'layout.menu.dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { titleKey: 'layout.menu.providers', icon: 'mdi-gas-station', to: '/providers', roles: ['ACCEPTION_ADMIN'] },
  { titleKey: 'layout.menu.auditLogs', icon: 'mdi-clipboard-text-clock', to: '/audit-logs', roles: ['ACCEPTION_ADMIN'] },
];

const filteredMenuItems = computed(() => {
  return menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => authStore.userRoles.includes(role));
  });
});

const handleLogout = async () => {
  await authStore.logout();
  await router.push('/login');
};
</script>
