import apiClient from './apiClient';

export interface UpdateProviderPayload {
  legalName?: string;
  tradeName?: string;
  phone?: string;
  responsibleName?: string;
  address?: Record<string, unknown>;
}

export const ProviderApi = {
  getMe() {
    return apiClient.get('/providers/me');
  },
  updateMe(data: UpdateProviderPayload) {
    return apiClient.patch('/providers/me', data);
  },
};
