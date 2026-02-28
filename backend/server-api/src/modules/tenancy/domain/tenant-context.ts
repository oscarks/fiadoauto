import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export type ActorType = 'PROVIDER' | 'CONVENIADO' | 'ACCEPTION';

export class TenantContext {
  constructor(
    public providerId: string | null,
    public conveniadoId: string | null,
    public userId: string,
    public role: UserRole,
    public actorType: ActorType,
  ) {}

  isProvider(): boolean {
    return this.actorType === 'PROVIDER';
  }

  isConveniado(): boolean {
    return this.actorType === 'CONVENIADO';
  }

  isAcception(): boolean {
    return this.actorType === 'ACCEPTION';
  }

  requireProviderId(): string {
    if (!this.providerId) {
      throw new ForbiddenException('Contexto de provider necessário.');
    }

    return this.providerId;
  }
}
