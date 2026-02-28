import apiClient from './apiClient';

export interface ProviderListParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export interface CreateProviderPayload {
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone?: string;
  responsibleName: string;
  address: Record<string, unknown>;
  adminUser: {
    email: string;
    name: string;
    password: string;
  };
}

export const ProviderApi = {
  list(params: ProviderListParams) {
    return apiClient.get('/admin/providers', { params });
  },
  getById(id: string) {
    return apiClient.get(`/admin/providers/${id}`);
  },
  create(data: CreateProviderPayload) {
    return apiClient.post('/admin/providers', data);
  },
  changeStatus(id: string, status: string) {
    return apiClient.patch(`/admin/providers/${id}/status`, { status });
  },
};
