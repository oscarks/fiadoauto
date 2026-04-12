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
    path: '/',
    component: AuthenticatedLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/presentation/views/HomeView.vue'),
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
