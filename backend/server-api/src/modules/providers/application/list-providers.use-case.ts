import { Inject, Injectable } from '@nestjs/common';
import { ProviderStatus } from '@prisma/client';
import { PaginatedResult } from '../../../shared/pagination/paginated-result';
import { PROVIDER_REPOSITORY } from '../domain/provider.ports';
import type { ProviderRepositoryPort } from '../domain/provider.ports';
import { ProviderEntity } from '../domain/provider.types';

@Injectable()
export class ListProvidersUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: ProviderRepositoryPort,
  ) {}

  execute(input: {
    page: number;
    limit: number;
    search?: string;
    status?: ProviderStatus;
  }): Promise<PaginatedResult<ProviderEntity>> {
    return this.providerRepository.findAll(input);
  }
}
