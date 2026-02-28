import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { AuthApi } from '../../infrastructure/http/AuthApi';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  providerId: string | null;
  conveniadoId: string | null;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const userRoles = computed(() => (user.value?.role ? [user.value.role] : []));
  const isAdmin = computed(() =>
    user.value?.role === 'ACCEPTION_ADMIN' || user.value?.role === 'PROVIDER_ADMIN',
  );

  const clearAuthState = () => {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    error.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const loadStoredAuth = () => {
    const storedToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      accessToken.value = storedToken;
      refreshToken.value = storedRefreshToken;
      user.value = JSON.parse(storedUser) as AuthUser;
    }
  };

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await AuthApi.login(email, password);
      accessToken.value = response.data.accessToken;
      refreshToken.value = response.data.refreshToken;

      if (accessToken.value) {
        localStorage.setItem('accessToken', accessToken.value);
      }
      if (refreshToken.value) {
        localStorage.setItem('refreshToken', refreshToken.value);
      }

      const meResponse = await AuthApi.me();
      user.value = meResponse.data as AuthUser;
      localStorage.setItem('user', JSON.stringify(user.value));
    } catch (err) {
      error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken.value) return;

    const response = await AuthApi.refresh(refreshToken.value);
    accessToken.value = response.data.accessToken;
    refreshToken.value = response.data.refreshToken;

    if (accessToken.value) {
      localStorage.setItem('accessToken', accessToken.value);
    }
    if (refreshToken.value) {
      localStorage.setItem('refreshToken', refreshToken.value);
    }
  };

  const logout = async () => {
    try {
      if (refreshToken.value) {
        await AuthApi.logout(refreshToken.value);
      }
    } finally {
      clearAuthState();
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    userRoles,
    isAdmin,
    login,
    logout,
    loadStoredAuth,
    refreshAccessToken,
    clearAuthState,
  };
});
