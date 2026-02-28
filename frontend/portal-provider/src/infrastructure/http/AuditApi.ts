import apiClient from './apiClient';

export interface AuditListParams {
  page: number;
  limit: number;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export const AuditApi = {
  list(params: AuditListParams) {
    return apiClient.get('/audit-logs', { params });
  },
  getById(id: string) {
    return apiClient.get(`/audit-logs/${id}`);
  },
};
