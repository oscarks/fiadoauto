import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards/authGuard'
import AuthenticatedLayout from '@/presentation/layouts/AuthenticatedLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/presentation/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/presentation/views/ForgotPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/presentation/views/ResetPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: AuthenticatedLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/presentation/views/DashboardView.vue'),
      },
      {
        path: 'providers',
        name: 'providers',
        component: () => import('@/presentation/views/ProvidersListView.vue'),
      },
      {
        path: 'providers/:id',
        name: 'provider-detail',
        component: () => import('@/presentation/views/ProviderDetailView.vue'),
      },
      {
        path: 'plans',
        name: 'plans',
        component: () => import('@/presentation/views/PlansListView.vue'),
      },
      {
        path: 'audit-log',
        name: 'audit-log',
        component: () => import('@/presentation/views/AuditLogView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(authGuard)

export default router
