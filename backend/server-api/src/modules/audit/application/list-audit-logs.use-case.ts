import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { buildPaginatedResult } from '../../../shared/pagination/paginated-result';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: {
    page: number;
    limit: number;
    providerId?: string;
    entity?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const where = {
      ...(input.providerId ? { providerId: input.providerId } : {}),
      ...(input.entity ? { entity: input.entity } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.startDate || input.endDate
        ? {
            createdAt: {
              ...(input.startDate ? { gte: new Date(input.startDate) } : {}),
              ...(input.endDate ? { lte: new Date(input.endDate) } : {}),
            },
          }
        : {}),
    };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(data, page, limit, total);
  }
}

@Injectable()
export class GetAuditLogByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, providerId?: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        id,
        ...(providerId ? { providerId } : {}),
      },
    });
    if (!log) {
      throw new NotFoundException('Audit log não encontrado.');
    }

    return log;
  }
}
