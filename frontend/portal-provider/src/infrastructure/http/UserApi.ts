import apiClient from './apiClient';

export interface UserListParams {
  page: number;
  limit: number;
  role?: string;
  status?: string;
  search?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: string;
}

export const UserApi = {
  list(params: UserListParams) {
    return apiClient.get('/users', { params });
  },
  create(data: CreateUserPayload) {
    return apiClient.post('/users', data);
  },
  update(id: string, data: UpdateUserPayload) {
    return apiClient.patch(`/users/${id}`, data);
  },
  block(id: string) {
    return apiClient.post(`/users/${id}/block`);
  },
  unblock(id: string) {
    return apiClient.post(`/users/${id}/unblock`);
  },
  deactivate(id: string) {
    return apiClient.delete(`/users/${id}`);
  },
};
