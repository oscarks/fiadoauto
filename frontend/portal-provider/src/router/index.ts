import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from './guards/authGuard';

const routes = [
  {
    path: '/login',
    name: 'login',
    meta: { requiresAuth: false },
    component: () => import('../presentation/views/LoginView.vue'),
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    meta: { requiresAuth: false },
    component: () => import('../presentation/views/ForgotPasswordView.vue'),
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    meta: { requiresAuth: false },
    component: () => import('../presentation/views/ResetPasswordView.vue'),
  },
  {
    path: '/verify-email/:token',
    name: 'verify-email',
    meta: { requiresAuth: false },
    component: () => import('../presentation/views/VerifyEmailView.vue'),
  },
  {
    path: '/',
    component: () => import('../presentation/layouts/AuthenticatedLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../presentation/views/HomeView.vue'),
      },
      {
        path: 'my-provider',
        name: 'my-provider',
        meta: { roles: ['PROVIDER_ADMIN'] },
        component: () => import('../presentation/views/ProviderProfileView.vue'),
      },
      {
        path: 'users',
        name: 'user-list',
        meta: { roles: ['PROVIDER_ADMIN'] },
        component: () => import('../presentation/views/UserListView.vue'),
      },
      {
        path: 'audit-logs',
        name: 'audit-logs',
        meta: { roles: ['PROVIDER_ADMIN'] },
        component: () => import('../presentation/views/AuditLogListView.vue'),
      }
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(authGuard);

export default router;
