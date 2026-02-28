import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProviderStatus } from '@prisma/client';
import { AuditService } from '../../audit/application/audit.service';
import { PROVIDER_REPOSITORY } from '../domain/provider.ports';
import type { ProviderRepositoryPort } from '../domain/provider.ports';

@Injectable()
export class ChangeProviderStatusUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: ProviderRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(providerId: string, status: ProviderStatus, actorUserId?: string) {
    const current = await this.providerRepository.findById(providerId);
    if (!current) {
      throw new NotFoundException('Provider não encontrado.');
    }

    const updated = await this.providerRepository.updateStatus(providerId, status);
    await this.auditService.log({
      action: 'PROVIDER_STATUS_CHANGED',
      entity: 'Provider',
      entityId: providerId,
      providerId,
      userId: actorUserId ?? null,
      oldValue: { status: current.status },
      newValue: { status: updated.status },
    });

    return updated;
  }
}
