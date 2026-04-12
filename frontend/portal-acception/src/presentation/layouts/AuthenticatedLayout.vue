<template>
  <v-app>
    <v-app-bar color="primary" elevation="0">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title class="font-weight-bold">{{ t('common.appName') }}</v-toolbar-title>
      <v-spacer />

      <v-menu v-if="authStore.user" min-width="220">
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar color="secondary" size="40">
              <span class="text-h6">{{ userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title class="font-weight-medium">{{ authStore.user.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ authStore.user.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider class="my-2" />
          <v-list-item prepend-icon="mdi-logout" @click="handleLogout">
            <v-list-item-title>{{ t('layout.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app>
      <v-list-item v-if="authStore.user" class="pa-4">
        <v-avatar color="primary" size="56">
          <span class="text-h5 text-white">{{ userInitials }}</span>
        </v-avatar>
        <template #title>
          <div class="font-weight-medium mt-2">{{ authStore.user.name }}</div>
        </template>
        <template #subtitle>
          <v-chip size="x-small" color="secondary" class="mt-1">{{ userRoleLabel }}</v-chip>
        </template>
      </v-list-item>

      <v-divider />

      <v-list density="compact" nav>
        <template v-for="item in filteredMenuItems" :key="item.title">
          <v-list-group
            v-if="item.children && item.children.length > 0"
            :value="item.title"
            :prepend-icon="item.icon"
          >
            <template #activator="{ props }">
              <v-list-item v-bind="props" :title="item.title" />
            </template>
            <v-list-item
              v-for="child in item.children"
              :key="child.title"
              :to="child.to"
              :prepend-icon="child.icon"
              :title="child.title"
              router
              exact
            />
          </v-list-group>

          <v-list-item
            v-else
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            router
            exact
          />
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>

    <GlobalMessageDialog />
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/application/stores/auth'
import GlobalMessageDialog from '@/presentation/components/GlobalMessageDialog.vue'

interface MenuItem {
  title: string
  icon: string
  to?: string
  roles?: string[]
  children?: MenuItem[]
  badge?: number
}

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const drawer = ref(true)

const menuItems = computed<MenuItem[]>(() => [
  {
    title: t('layout.menu.dashboard'),
    icon: 'mdi-view-dashboard',
    to: '/',
    roles: ['ACCEPTION_ADMIN'],
  },
  {
    title: t('layout.menu.providers'),
    icon: 'mdi-domain',
    to: '/providers',
    roles: ['ACCEPTION_ADMIN'],
  },
  {
    title: t('layout.menu.plans'),
    icon: 'mdi-cash-multiple',
    to: '/plans',
    roles: ['ACCEPTION_ADMIN'],
  },
  {
    title: t('layout.menu.auditLog'),
    icon: 'mdi-clipboard-text-clock',
    to: '/audit-log',
    roles: ['ACCEPTION_ADMIN'],
  },
])

function filterByRole(items: MenuItem[]): MenuItem[] {
  const userRoles = authStore.userRoles

  return items
    .filter(item => {
      if (!item.roles || item.roles.length === 0) return true
      return item.roles.some(r => userRoles.includes(r))
    })
    .map(item => {
      if (!item.children) return item
      const filteredChildren = filterByRole(item.children)
      if (filteredChildren.length === 0) return null
      return { ...item, children: filteredChildren }
    })
    .filter(Boolean) as MenuItem[]
}

const filteredMenuItems = computed(() => filterByRole(menuItems.value))

const userInitials = computed(() => {
  const name = authStore.user?.name
  if (!name) return '?'

  const parts = name.split(' ')
  if (parts.length < 2) return parts[0].slice(0, 1).toUpperCase()

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
})

const userRoleLabel = computed(() => authStore.userRoles[0] ?? 'USER')

async function handleLogout() {
  await authStore.logout()
  await router.push({ name: 'login' })
}
</script>
