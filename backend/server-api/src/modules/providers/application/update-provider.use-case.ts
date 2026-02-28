import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../audit/application/audit.service';
import { PROVIDER_REPOSITORY } from '../domain/provider.ports';
import type { ProviderRepositoryPort } from '../domain/provider.ports';

@Injectable()
export class UpdateProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: ProviderRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    providerId: string,
    data: {
      legalName?: string;
      tradeName?: string;
      phone?: string | null;
      responsibleName?: string;
      address?: unknown;
    },
    actorUserId?: string,
  ) {
    const current = await this.providerRepository.findById(providerId);
    if (!current) {
      throw new NotFoundException('Provider não encontrado.');
    }

    const updated = await this.providerRepository.update(providerId, data);
    await this.auditService.log({
      action: 'PROVIDER_UPDATED',
      entity: 'Provider',
      entityId: providerId,
      providerId,
      userId: actorUserId ?? null,
      oldValue: current,
      newValue: updated,
    });

    return updated;
  }
}
