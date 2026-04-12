import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../integrations/storage/prisma/prisma.service';

export interface CreateAuditLogInput {
  providerId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: Prisma.InputJsonValue;
  ipAddress: string;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        providerId: input.providerId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details,
        ipAddress: input.ipAddress,
      },
    });
  }
}
