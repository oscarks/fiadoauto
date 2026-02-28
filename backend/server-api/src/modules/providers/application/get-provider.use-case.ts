import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PROVIDER_REPOSITORY } from '../domain/provider.ports';
import type { ProviderRepositoryPort } from '../domain/provider.ports';
import { ProviderEntity } from '../domain/provider.types';

@Injectable()
export class GetProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: ProviderRepositoryPort,
  ) {}

  async execute(providerId: string): Promise<ProviderEntity> {
    const provider = await this.providerRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundException('Provider não encontrado.');
    }

    return provider;
  }
}
