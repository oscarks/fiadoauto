import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/application/stores/auth'

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated && localStorage.getItem('accessToken')) {
    authStore.loadStoredAuth()
  }

  const requiresAuth = to.meta.requiresAuth ?? true
  const isPublicPage = to.meta.requiresAuth === false

  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (isPublicPage && authStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.some(role => authStore.userRoles.includes(role))) {
    return next({ name: 'home' })
  }

  return next()
}
