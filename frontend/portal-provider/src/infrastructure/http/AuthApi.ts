import apiClient from './apiClient';

export const AuthApi = {
  login(email: string, password: string) {
    return apiClient.post('/auth/login', { email, password });
  },
  refresh(refreshToken: string) {
    return apiClient.post('/auth/refresh', { refreshToken });
  },
  logout(refreshToken: string) {
    return apiClient.post('/auth/logout', { refreshToken });
  },
  me() {
    return apiClient.get('/auth/me');
  },
  forgotPassword(email: string) {
    return apiClient.post('/auth/forgot-password', { email });
  },
  resetPassword(token: string, newPassword: string) {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },
  verifyEmail(token: string) {
    return apiClient.post('/auth/verify-email', { token });
  },
};
