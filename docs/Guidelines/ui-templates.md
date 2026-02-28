# Diretrizes de UI Templates

> Documento de referencia para replicacao do padrao de templates de interface nas aplicacoes Vue 3 + Vuetify 3.
> Destinado a agentes de IA implementando via SDD (Specification-Driven Development).

---

## 1. Visao Geral da Arquitetura de Templates

O sistema de UI utiliza **dois templates distintos** controlados pelo Vue Router, alternando automaticamente entre eles conforme o estado de autenticacao do usuario:

| Template | Contexto | Componentes Vuetify | Quando Renderizado |
|----------|----------|--------------------|--------------------|
| **Public Template** | Usuario nao autenticado | `v-container` (pagina avulsa) | Rotas com `meta.requiresAuth: false` |
| **Authenticated Template** | Usuario autenticado | `v-app` + `v-app-bar` + `v-navigation-drawer` + `v-main` | Rotas filhas do layout autenticado |

### Diagrama de Decisao

```
URL acessada
    |
    v
[Router Guard]
    |
    +-- requiresAuth: false --> Renderiza rota diretamente (Public Template)
    |                           Ex: LoginView, SignupView
    |
    +-- requiresAuth: true
         |
         +-- NAO autenticado --> Redireciona para /login
         |                       (salva rota original em query.redirect)
         |
         +-- Autenticado
              |
              +-- [Verifica status do tenant] (se aplicavel)
              |    +-- BLOCKED/PENDING --> Redireciona para /tenant-blocked
              |
              +-- [Verifica permissoes de role] (se aplicavel)
              |    +-- Sem permissao --> Redireciona para /dashboard ou /home
              |
              +-- OK --> Renderiza dentro do Authenticated Layout
```

---

## 2. Estrutura de Arquivos

```
src/
├── App.vue                           # Componente raiz (apenas <router-view />)
├── main.ts                           # Bootstrap: Vue + Pinia + Router + Vuetify + i18n
├── router/
│   ├── index.ts                      # Definicao de rotas com layouts
│   └── guards/
│       └── authGuard.ts              # Guard global de autenticacao
├── presentation/
│   ├── layouts/
│   │   └── AuthenticatedLayout.vue   # Layout principal (app-bar + drawer + main)
│   ├── views/
│   │   ├── LoginView.vue             # Pagina publica de login
│   │   └── [...]                     # Views protegidas
│   └── components/
│       ├── common/
│       │   └── GlobalSnackbar.vue    # Notificacoes toast
│       └── GlobalMessageDialog.vue   # Dialogo modal global
├── application/
│   ├── stores/
│   │   └── auth.ts                   # Pinia store de autenticacao
│   └── composables/
│       ├── useSnackbar.ts            # Estado global de snackbar
│       ├── useGlobalDialog.ts        # Estado global de dialogo
│       ├── useTheme.ts               # Toggle light/dark (opcional)
│       └── useLocale.ts              # Seletor de idioma (opcional)
├── infrastructure/
│   └── http/
│       ├── apiClient.ts              # Axios com interceptors
│       └── AuthApi.ts                # Endpoints de autenticacao
├── plugins/
│   └── vuetify.ts                    # Configuracao do Vuetify
└── i18n/
    ├── index.ts                      # Setup i18n
    └── locales/                      # Arquivos de traducao
```

---

## 3. Configuracao do Vue Router

### 3.1 Definicao de Rotas

O Router define dois grupos de rotas:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards'
import AuthenticatedLayout from '@/presentation/layouts/AuthenticatedLayout.vue'

const routes: RouteRecordRaw[] = [
  // ─── ROTAS PUBLICAS (sem layout autenticado) ───
  {
    path: '/login',
    name: 'login',
    component: () => import('@/presentation/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  // Outras rotas publicas: /signup, /activate, /forgot-password, etc.

  // ─── ROTAS PROTEGIDAS (dentro do layout autenticado) ───
  {
    path: '/',
    component: AuthenticatedLayout,   // <-- Layout wrapper
    meta: { requiresAuth: true },     // <-- Protecao padrao
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/presentation/views/HomeView.vue'),
      },
      {
        path: 'resource',
        name: 'resource-list',
        component: () => import('@/presentation/views/ResourceListView.vue'),
        meta: { roles: ['ADMIN', 'SUPERVISOR'] },  // restricao por role
      },
      // ... demais rotas protegidas
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Guard GLOBAL aplicado a TODAS as navegacoes
router.beforeEach(authGuard)

export default router
```

**Principios**:
- Rotas publicas sao definidas no nivel raiz, **fora** do layout autenticado
- Rotas protegidas sao `children` do componente de layout
- `meta.requiresAuth` padrao e `true` (omitir = protegido)
- `meta.roles` define roles permitidas (opcional)
- Lazy-loading via `() => import(...)` para todas as views

### 3.2 Guard de Autenticacao

```typescript
// router/guards/authGuard.ts
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/application/stores/auth'

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()

  // 1. Restaurar auth do localStorage se nao carregado
  if (!authStore.isAuthenticated && localStorage.getItem('accessToken')) {
    authStore.loadStoredAuth()
  }

  const requiresAuth = to.meta.requiresAuth ?? true
  const isPublicPage = to.meta.requiresAuth === false

  // 2. Rota protegida + nao autenticado → login
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // 3. Pagina publica + ja autenticado → redireciona para home
  if (isPublicPage && authStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  // 4. Verificacao de roles (se definidas na rota)
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.some(r => authStore.userRoles.includes(r))) {
    return next({ name: 'home' })
  }

  // 5. Verificacoes adicionais (ex: status do tenant)
  // if (authStore.isTenantBlocked) return next({ name: 'tenant-blocked' })

  next()
}
```

**Meta properties suportadas**:

| Meta | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `requiresAuth` | `boolean` | `true` | Se a rota exige autenticacao |
| `roles` | `string[]` | `undefined` | Roles permitidas (se omitido, qualquer role autenticada) |
| `requiresTenantAdmin` | `boolean` | `false` | Atalho para roles de admin do tenant |
| `requiresSupervisor` | `boolean` | `false` | Atalho para roles de supervisor+ |

---

## 4. Template Publico (Usuario Nao Autenticado)

### 4.1 Caracteristicas

- **Nao utiliza** `v-app`, `v-app-bar`, `v-navigation-drawer`
- Renderizado diretamente pelo `<router-view />` do `App.vue`
- Cada view publica e auto-contida (contem seu proprio layout)
- Tipicamente: fundo gradiente + card centralizado

### 4.2 Padrao de LoginView

```vue
<template>
  <v-container fluid class="fill-height login-container">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card elevation="8" class="pa-6">
          <!-- Logo / Titulo -->
          <v-card-title class="text-center mb-4">
            <h1 class="text-h4 font-weight-bold">{{ t('common.appName') }}</h1>
            <p class="text-subtitle-1 text-medium-emphasis mt-2">
              {{ t('views.login.subtitle') }}
            </p>
          </v-card-title>

          <!-- Formulario -->
          <v-card-text>
            <v-form ref="formRef" v-model="formValid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="credentials.email"
                :label="t('views.login.emailLabel')"
                type="email"
                prepend-inner-icon="mdi-email"
                :rules="emailRules"
                :disabled="authStore.loading"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              />

              <v-text-field
                v-model="credentials.password"
                :label="t('views.login.passwordLabel')"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="passwordRules"
                :disabled="authStore.loading"
                variant="outlined"
                density="comfortable"
                class="mb-4"
              />

              <!-- Alerta de erro -->
              <v-alert
                v-if="authStore.error"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
                closable
              >
                {{ authStore.error }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="authStore.loading"
                :disabled="!formValid || authStore.loading"
              >
                {{ t('views.login.submit') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>
```

### 4.3 Outras Views Publicas

Seguem o mesmo padrao visual (container centralizado + card), com adaptacoes:

| View | Descricao |
|------|-----------|
| `LoginView` | Formulario de login (email + password) |
| `SignupView` | Cadastro de novo tenant (nome, email, plano) |
| `ActivateTenantView` | Ativacao de conta via token |
| `ActivateUserView` | Ativacao de usuario convidado |
| `TenantBlockedView` | Tela informativa para tenant bloqueado |
| `ForgotPasswordView` | Recuperacao de senha |

---

## 5. Template Autenticado (Usuario Logado)

### 5.1 Hierarquia de Componentes Vuetify

```
<v-app>                          ← Container raiz do Vuetify (obrigatorio)
  ├── <v-app-bar>                ← Barra superior fixa
  │     ├── v-app-bar-nav-icon   ← Botao hamburger (toggle do drawer)
  │     ├── v-toolbar-title      ← Titulo da aplicacao
  │     ├── v-spacer             ← Empurra conteudo para a direita
  │     ├── [Seletor de Idioma]  ← (opcional) Menu de idiomas
  │     ├── [Toggle de Tema]     ← (opcional) Botao light/dark
  │     └── [Menu do Usuario]    ← Avatar + dropdown com logout
  │
  ├── <v-navigation-drawer>      ← Menu lateral colapsavel
  │     ├── [Info do Usuario]    ← Avatar + nome + role chip
  │     ├── v-divider
  │     └── <v-list>             ← Lista de itens de menu
  │           ├── v-list-item    ← Item simples (icon + titulo + rota)
  │           └── v-list-group   ← Grupo expansivel (icon + titulo + filhos)
  │                 └── v-list-item  ← Sub-item
  │
  └── <v-main>                   ← Area de conteudo principal
        └── <router-view />      ← Renderiza a view da rota atual
```

### 5.2 Componente Layout Completo

```vue
<template>
  <v-app>
    <!-- ═══ BARRA SUPERIOR ═══ -->
    <v-app-bar color="primary" elevation="0">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title class="font-weight-bold">
        {{ appTitle }}
      </v-toolbar-title>
      <v-spacer />

      <!-- Seletor de Idioma (opcional) -->
      <v-menu v-if="showLocaleSelector">
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <span>{{ currentLocaleFlag }}</span>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="option in localeOptions"
            :key="option.value"
            @click="setLocale(option.value)"
          >
            <v-list-item-title>
              {{ option.flag }} {{ option.label }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Toggle de Tema (opcional) -->
      <v-btn
        v-if="showThemeToggle"
        icon
        @click="toggleTheme"
      >
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <!-- Menu do Usuario -->
      <v-menu v-if="authStore.user" min-width="200">
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar color="secondary" size="40">
              <span class="text-h6">{{ userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title class="font-weight-medium">
              {{ authStore.user.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ authStore.user.email }}
            </v-list-item-subtitle>
          </v-list-item>
          <v-divider class="my-2" />
          <v-list-item @click="handleLogout" prepend-icon="mdi-logout">
            <v-list-item-title>{{ t('layout.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- ═══ MENU LATERAL ═══ -->
    <v-navigation-drawer v-model="drawer" app>
      <!-- Info do Usuario -->
      <v-list-item v-if="authStore.user" class="pa-4">
        <v-avatar color="primary" size="56">
          <span class="text-h5 text-white">{{ userInitials }}</span>
        </v-avatar>
        <template #title>
          <div class="font-weight-medium mt-2">{{ authStore.user.name }}</div>
        </template>
        <template #subtitle>
          <v-chip size="x-small" :color="roleChipColor" class="mt-1">
            {{ userRoleLabel }}
          </v-chip>
        </template>
      </v-list-item>

      <v-divider />

      <!-- Menu de Navegacao -->
      <v-list density="compact" nav>
        <template v-for="item in filteredMenuItems" :key="item.title">
          <!-- Grupo com filhos -->
          <v-list-group
            v-if="item.children"
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

          <!-- Item simples -->
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

    <!-- ═══ CONTEUDO PRINCIPAL ═══ -->
    <v-main>
      <router-view />
    </v-main>

    <!-- Componentes globais -->
    <GlobalMessageDialog />
  </v-app>
</template>
```

### 5.3 Script do Layout

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/application/stores/auth'
import { useI18n } from 'vue-i18n'
import GlobalMessageDialog from '@/presentation/components/GlobalMessageDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// ─── Estado ───
const drawer = ref(true)

// ─── Menu Items ───
interface MenuItem {
  title: string
  icon: string
  to?: string
  roles?: string[]          // roles que podem ver este item
  children?: MenuItem[]
  badge?: number            // contador opcional (ex: fila de atendimento)
}

const menuItems = computed<MenuItem[]>(() => [
  {
    title: t('layout.menu.dashboard'),
    icon: 'mdi-view-dashboard',
    to: '/',
  },
  {
    title: t('layout.menu.resources'),
    icon: 'mdi-folder',
    to: '/resources',
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    title: t('layout.menu.settings'),
    icon: 'mdi-cog',
    roles: ['ADMIN'],
    children: [
      {
        title: t('layout.menu.general'),
        icon: 'mdi-cog-outline',
        to: '/settings/general',
      },
      {
        title: t('layout.menu.users'),
        icon: 'mdi-account-group',
        to: '/settings/users',
      },
    ],
  },
])

// ─── Filtragem por Role ───
const filteredMenuItems = computed(() => {
  const userRoles = authStore.userRoles

  function filterByRole(items: MenuItem[]): MenuItem[] {
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

  return filterByRole(menuItems.value)
})

// ─── Computed ───
const userInitials = computed(() => {
  if (!authStore.user) return '?'
  const names = authStore.user.name.split(' ')
  return names.length >= 2
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0][0].toUpperCase()
})

// ─── Actions ───
async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>
```

---

## 6. Barra Superior (App Bar)

### 6.1 Estrutura

```
┌──────────────────────────────────────────────────────────────┐
│ [☰]  Titulo da Aplicacao          [🌐] [🌙] [Avatar ▼]     │
└──────────────────────────────────────────────────────────────┘
  │       │                           │     │      │
  │       │                           │     │      └─ Menu do Usuario
  │       │                           │     └─ Toggle de Tema (opcional)
  │       │                           └─ Seletor de Idioma (opcional)
  │       └─ v-toolbar-title
  └─ v-app-bar-nav-icon (toggle drawer)
```

### 6.2 Componentes e Funcionalidades

| Elemento | Componente Vuetify | Funcionalidade |
|----------|-------------------|----------------|
| Hamburger | `v-app-bar-nav-icon` | Toggle do `v-navigation-drawer` via `drawer = !drawer` |
| Titulo | `v-toolbar-title` | Nome da aplicacao (i18n) |
| Idioma | `v-menu` + `v-list` | Selecao de locale (persiste em localStorage) |
| Tema | `v-btn` icon | Alterna entre light/dark theme do Vuetify |
| Avatar | `v-menu` + `v-avatar` | Exibe iniciais do usuario, dropdown com nome/email e logout |

### 6.3 Comportamentos

- **Responsividade**: O hamburger aparece sempre; em telas menores o drawer se comporta como overlay
- **Estado do drawer**: Controlado por `ref(true)` — aberto por padrao em desktop
- **Cor**: `color="primary"` com `elevation="0"` (sem sombra, usa borda inferior)
- **Sticky**: Fixa no topo (comportamento padrao do `v-app-bar` dentro de `v-app`)

---

## 7. Menu Lateral (Navigation Drawer)

### 7.1 Estrutura

```
┌─────────────────────┐
│  [Avatar]           │
│  Nome do Usuario    │
│  [ADMIN]            │  ← chip com role
├─────────────────────┤
│  📊 Dashboard       │  ← item simples
│  🏢 Tenants         │  ← item simples
│  📦 Plans           │  ← item simples
│  📋 Logs ▼          │  ← grupo expansivel
│    📧 Email Logs    │
│    📝 Audit Logs    │
│  🔌 Integracoes ▼  │  ← grupo expansivel
│    🔑 API Keys      │
│    📱 WhatsApp      │
└─────────────────────┘
```

### 7.2 Interface de Definicao de Menu

```typescript
interface MenuItem {
  title: string         // Texto exibido (deve usar i18n)
  icon: string          // Icone MDI (ex: 'mdi-view-dashboard')
  to?: string           // Rota de destino (usa Vue Router 'to' prop)
  roles?: string[]      // Roles que podem ver este item (vazio = todos)
  children?: MenuItem[] // Sub-itens (renderiza como v-list-group)
  badge?: number        // Contador opcional no item
}
```

### 7.3 Filtragem por Roles

O menu e filtrado em tempo real com base nas roles do usuario autenticado:

1. Cada `MenuItem` pode ter `roles: ['ADMIN', 'SUPERVISOR']`
2. Se `roles` esta vazio ou ausente, o item e visivel para todos
3. Se o usuario possui **qualquer** role listada, o item aparece
4. Para grupos com `children`, filtra os filhos individualmente
5. Se apos filtrar um grupo nao restar nenhum filho, o grupo inteiro e ocultado

### 7.4 Componentes Vuetify do Menu

| Componente | Uso |
|------------|-----|
| `v-navigation-drawer` | Container do menu lateral; `v-model="drawer"`, prop `app` |
| `v-list` | Container dos itens; `density="compact"`, `nav` |
| `v-list-item` | Item simples; `:to` para rota, `:prepend-icon`, `:title`, `router`, `exact` |
| `v-list-group` | Grupo expansivel; `:prepend-icon`, slot `#activator` |
| `v-chip` | Badge de role do usuario; `size="x-small"`, `color` dinamico |
| `v-avatar` | Avatar do usuario; `color="primary"`, `size="56"` |

---

## 8. Auth Store (Pinia)

### 8.1 Interface

```typescript
// application/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ───
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ───
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRoles = computed(() => user.value?.roles ?? [])

  // Role checks (adaptar conforme necessidade do projeto)
  const isAdmin = computed(() => userRoles.value.includes('ADMIN'))
  const isSupervisor = computed(() => userRoles.value.includes('SUPERVISOR'))

  // ─── Actions ───
  async function login(credentials: LoginRequest): Promise<void> { /* ... */ }
  async function logout(): Promise<void> { /* ... */ }
  function loadStoredAuth(): void { /* ... */ }
  function clearAuthState(): void { /* ... */ }
  async function refreshAccessToken(): Promise<void> { /* ... */ }

  return {
    user, accessToken, refreshToken, loading, error,
    isAuthenticated, userRoles, isAdmin, isSupervisor,
    login, logout, loadStoredAuth, clearAuthState, refreshAccessToken,
  }
})
```

### 8.2 Persistencia

| Chave localStorage | Conteudo |
|--------------------|----------|
| `accessToken` | JWT de acesso (string) |
| `refreshToken` | Token de refresh (UUID string) |
| `user` | JSON serializado do objeto User |
| `tenant` | JSON serializado do objeto Tenant (se aplicavel) |

### 8.3 Ciclo de Vida

```
App inicia → loadStoredAuth() → isAuthenticated = true/false
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                     │
               [Autenticado]                        [Nao Autenticado]
                    │                                     │
          Renderiza Layout                       Redireciona /login
          Autenticado                                     │
                    │                              login(credentials)
                    │                                     │
               API requests                        Armazena tokens
               (interceptor                        + user no state
                injeta Bearer)                     e localStorage
                    │                                     │
               Se 401 →                           Redireciona para
               clearAuthState()                    rota original
               + redirect /login
```

---

## 9. HTTP Client (Axios)

### 9.1 Interceptor de Request

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 9.2 Interceptor de Response

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou invalido
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
```

**Comportamento**: Qualquer resposta 401 limpa o estado de auth e redireciona para login, garantindo que tokens expirados nao mantenham o usuario numa sessao invalida.

---

## 10. Componentes Globais

### 10.1 App.vue (Componente Raiz)

```vue
<template>
  <router-view />
  <GlobalSnackbar />
</template>
```

- Apenas renderiza o `<router-view />` (que sera LoginView ou AuthenticatedLayout)
- `GlobalSnackbar` esta fora do layout para funcionar em ambos os contextos

### 10.2 GlobalSnackbar (Notificacoes Toast)

- Posicao: top right
- Tipos: `success`, `error`, `warning`, `info`
- Gerenciado por composable `useSnackbar()` com estado global (singleton via `ref` no modulo)
- Acessivel de qualquer componente ou store

### 10.3 GlobalMessageDialog (Modal)

- Renderizado dentro do layout autenticado
- Tipos: `message`, `info`, `warning`, `error`
- Gerenciado por composable `useGlobalDialog()` com estado global

---

## 11. Vuetify: Configuracao Base

```typescript
// plugins/vuetify.ts
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',   // ou detectar de localStorage/sistema
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
        },
      },
      dark: {
        // Definir cores do tema escuro
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
```

**Dependencias**:
- `vuetify` (framework UI)
- `@mdi/font` (icones Material Design)
- `vite-plugin-vuetify` (auto-import de componentes no build)

---

## 12. Internacionalizacao (i18n)

Todas as strings de UI devem usar `t('chave')` do vue-i18n. Chaves relevantes ao template:

```yaml
layout:
  title: "Nome da Aplicacao"
  logout: "Sair"
  userRole: "Administrador"
  menu:
    dashboard: "Dashboard"
    resources: "Recursos"
    settings: "Configuracoes"
    # ... demais itens

views:
  login:
    subtitle: "Acesse sua conta"
    emailLabel: "E-mail"
    passwordLabel: "Senha"
    submit: "Entrar"
    validation:
      emailRequired: "E-mail obrigatorio"
      emailInvalid: "E-mail invalido"
      passwordRequired: "Senha obrigatoria"
      passwordMin: "Minimo 6 caracteres"

common:
  appName: "Nome do App"
  actions:
    close: "Fechar"
```

---

## 13. Diferencas entre Paineis

O padrao e o mesmo, com variacoes de configuracao:

| Aspecto | Admin Panel | Tenant Panel |
|---------|-------------|-------------|
| Layout | `DefaultLayout.vue` | `TenantLayout.vue` |
| Roles no menu | Fixo (SUPER_ADMIN) | Dinamico (TENANT_ADMIN, SUPERVISOR, CORRETOR) |
| Seletor de idioma na app bar | Nao | Sim |
| Toggle de tema na app bar | Nao | Sim |
| Verificacao de status do tenant | Nao | Sim (ACTIVE/BLOCKED/PENDING) |
| Auth guard | Auth + SuperAdmin | Auth + Tenant Status + Roles |
| Auth store getters | `isSuperAdmin` | `isTenantAdmin`, `isSupervisor`, `isCorretor` |
| Titulo app bar | Fixo (nome do app) | Dinamico (nome do tenant) |

---

## 14. Checklist de Implementacao

Ao replicar este padrao em um novo projeto:

### Infraestrutura
- [ ] Criar projeto Vue 3 com Vite
- [ ] Instalar: `vuetify`, `@mdi/font`, `vite-plugin-vuetify`, `pinia`, `vue-router`, `vue-i18n`, `axios`
- [ ] Configurar `plugins/vuetify.ts` com tema e icones
- [ ] Configurar `i18n/index.ts` com locales
- [ ] Configurar `main.ts` registrando todos os plugins

### Autenticacao
- [ ] Criar `application/stores/auth.ts` (Pinia) com state, getters e actions
- [ ] Criar `infrastructure/http/apiClient.ts` com interceptors Axios
- [ ] Criar `infrastructure/http/AuthApi.ts` com endpoints de login/logout/refresh
- [ ] Criar `router/guards/authGuard.ts` com logica de protecao

### Templates
- [ ] Criar `App.vue` com `<router-view />` e `<GlobalSnackbar />`
- [ ] Criar `presentation/layouts/AuthenticatedLayout.vue` com `v-app` + `v-app-bar` + `v-navigation-drawer` + `v-main`
- [ ] Criar `presentation/views/LoginView.vue` como pagina publica
- [ ] Definir rotas: publicas no nivel raiz, protegidas como children do layout

### Menu e Navegacao
- [ ] Definir array de `MenuItem[]` com i18n e roles
- [ ] Implementar filtragem computed por roles do usuario
- [ ] Configurar `v-list-item` com prop `router` e `to` para navegacao

### Componentes Globais
- [ ] Criar `composables/useSnackbar.ts` com estado global
- [ ] Criar `composables/useGlobalDialog.ts` com estado global
- [ ] Criar `components/common/GlobalSnackbar.vue`
- [ ] Criar `components/GlobalMessageDialog.vue`

---

## 15. Padrao de Rotas Publicas Adicionais

Quando a aplicacao necessita de mais paginas publicas (signup, recuperacao de senha, etc.), todas seguem o mesmo padrao:

```typescript
// No router/index.ts
const routes: RouteRecordRaw[] = [
  // Rotas publicas — cada uma com seu proprio visual
  { path: '/login',            meta: { requiresAuth: false }, component: () => import('...') },
  { path: '/signup',           meta: { requiresAuth: false }, component: () => import('...') },
  { path: '/forgot-password',  meta: { requiresAuth: false }, component: () => import('...') },
  { path: '/activate/:token',  meta: { requiresAuth: false }, component: () => import('...') },
  { path: '/tenant-blocked',   meta: { requiresAuth: false }, component: () => import('...') },

  // Rotas autenticadas — dentro do layout
  {
    path: '/',
    component: AuthenticatedLayout,
    meta: { requiresAuth: true },
    children: [/* ... */],
  },
]
```

Nao e necessario criar um "PublicLayout" wrapper — cada view publica contem seu proprio layout visual. O `v-container fluid` com `fill-height` e suficiente para centralizar o conteudo.

---

## 16. Resumo dos Componentes Vuetify Utilizados

| Componente | Onde | Funcao |
|------------|------|--------|
| `v-app` | Layout autenticado | Container raiz Vuetify |
| `v-app-bar` | Layout autenticado | Barra superior fixa |
| `v-app-bar-nav-icon` | App bar | Toggle do drawer |
| `v-toolbar-title` | App bar | Titulo |
| `v-navigation-drawer` | Layout autenticado | Menu lateral |
| `v-main` | Layout autenticado | Area de conteudo |
| `v-list` / `v-list-item` | Drawer + menus | Itens de navegacao |
| `v-list-group` | Drawer | Grupos expansiveis |
| `v-menu` | App bar | Dropdowns (usuario, idioma) |
| `v-avatar` | App bar + drawer | Iniciais do usuario |
| `v-chip` | Drawer | Badge de role |
| `v-container` | Views | Container responsivo |
| `v-row` / `v-col` | Views | Grid layout |
| `v-card` | Login + views | Card container |
| `v-form` | Login | Formulario com validacao |
| `v-text-field` | Login | Campos de input |
| `v-btn` | Everywhere | Botoes |
| `v-icon` | Everywhere | Icones MDI |
| `v-alert` | Login | Mensagens de erro |
| `v-snackbar` | GlobalSnackbar | Notificacoes toast |
| `v-dialog` | GlobalMessageDialog | Modais |
| `v-spacer` | App bar | Espacamento flexivel |
| `v-divider` | Drawer + menus | Separador visual |
