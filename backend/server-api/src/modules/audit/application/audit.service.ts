import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

interface AuditLogInput {
  providerId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          providerId: input.providerId ?? null,
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          ...(input.oldValue !== undefined
            ? {
                oldValue:
                  input.oldValue === null
                    ? Prisma.JsonNull
                    : (input.oldValue as Prisma.InputJsonValue),
              }
            : {}),
          ...(input.newValue !== undefined
            ? {
                newValue:
                  input.newValue === null
                    ? Prisma.JsonNull
                    : (input.newValue as Prisma.InputJsonValue),
              }
            : {}),
        },
      });
    } catch (error) {
      this.logger.error('Falha ao gravar audit log', error);
    }
  }
}
