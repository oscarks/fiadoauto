import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuditService } from '../../audit/application/audit.service';
import { USER_REPOSITORY } from '../domain/auth.ports';
import type { UserRepositoryPort } from '../domain/auth.ports';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    providerId: string,
    userId: string,
    input: {
      name?: string;
      role?: UserRole;
    },
    actorUserId?: string,
  ) {
    if (
      input.role &&
      !new Set<UserRole>([UserRole.PROVIDER_OPERATOR, UserRole.PROVIDER_MANAGER]).has(input.role)
    ) {
      throw new ForbiddenException('Role inválido para atualização.');
    }

    const current = await this.userRepository.findByIdInProvider(providerId, userId);
    if (!current) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const updated = await this.userRepository.updateInProvider(providerId, userId, input);
    await this.auditService.log({
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: userId,
      providerId,
      userId: actorUserId ?? null,
      oldValue: current,
      newValue: updated,
    });

    return updated;
  }
}
