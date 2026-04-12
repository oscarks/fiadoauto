import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../integrations/storage/prisma/prisma.service';

export interface CreateAuditLogInput {
  providerId?: string | null;
  actorUserId?: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        providerId: input.providerId ?? null,
        actorUserId: input.actorUserId ?? null,
        actorType: input.actorType,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        detailsJson: input.details,
        ipAddress: input.ipAddress ?? null,
      },
    });
  }
}
