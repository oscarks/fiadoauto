import { ProviderStatus } from '@prisma/client';
import { PaginatedResult } from '../../../shared/pagination/paginated-result';
import { CreateProviderData, ProviderEntity, UpdateProviderData } from './provider.types';

export const PROVIDER_REPOSITORY = Symbol('PROVIDER_REPOSITORY');

export interface ProviderListFilters {
  status?: ProviderStatus;
  search?: string;
  page: number;
  limit: number;
}

export interface ProviderRepositoryPort {
  findAll(filters: ProviderListFilters): Promise<PaginatedResult<ProviderEntity>>;
  findById(id: string): Promise<ProviderEntity | null>;
  create(data: CreateProviderData): Promise<ProviderEntity>;
  update(id: string, data: UpdateProviderData): Promise<ProviderEntity>;
  updateStatus(id: string, status: ProviderStatus): Promise<ProviderEntity>;
  countByStatus(): Promise<Record<ProviderStatus, number>>;
}
