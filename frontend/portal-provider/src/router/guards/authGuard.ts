import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../../application/stores/auth';

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated && localStorage.getItem('accessToken')) {
    authStore.loadStoredAuth();
  }

  const requiresAuth = to.meta.requiresAuth !== false;
  const isPublicPage = to.meta.requiresAuth === false;

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  if (isPublicPage && authStore.isAuthenticated) {
    next({ name: 'home' });
    return;
  }

  const requiredRoles = to.meta.roles as string[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = authStore.userRoles.some((role) => requiredRoles.includes(role));
    if (!hasRole) {
      next({ name: 'home' });
      return;
    }
  }

  next();
}
