import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuditService } from '../../audit/application/audit.service';
import { USER_REPOSITORY } from '../domain/auth.ports';
import type { UserRepositoryPort } from '../domain/auth.ports';

@Injectable()
export class UnblockUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(providerId: string, userId: string, actorUserId?: string) {
    const current = await this.userRepository.findByIdInProvider(providerId, userId);
    if (!current) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const updated = await this.userRepository.updateInProvider(providerId, userId, {
      status: UserStatus.ACTIVE,
    });
    await this.auditService.log({
      action: 'USER_UNBLOCKED',
      entity: 'User',
      entityId: userId,
      providerId,
      userId: actorUserId ?? null,
      oldValue: { status: current.status },
      newValue: { status: updated.status },
    });

    return updated;
  }
}
