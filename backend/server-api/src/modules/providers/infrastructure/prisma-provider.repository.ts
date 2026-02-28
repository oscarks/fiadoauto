import { Injectable } from '@nestjs/common';
import { Prisma, ProviderStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { buildPaginatedResult } from '../../../shared/pagination/paginated-result';
import { ProviderListFilters, ProviderRepositoryPort } from '../domain/provider.ports';
import { CreateProviderData, ProviderEntity, UpdateProviderData } from '../domain/provider.types';

@Injectable()
export class PrismaProviderRepository implements ProviderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ProviderListFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { legalName: { contains: filters.search, mode: 'insensitive' as const } },
              { tradeName: { contains: filters.search, mode: 'insensitive' as const } },
              { cnpj: { contains: filters.search } },
            ],
          }
        : {}),
    };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return buildPaginatedResult(data, page, limit, total);
  }

  findById(id: string): Promise<ProviderEntity | null> {
    return this.prisma.provider.findUnique({
      where: { id },
    });
  }

  async create(data: CreateProviderData): Promise<ProviderEntity> {
    const created = await this.prisma.provider.create({
      data: {
        legalName: data.legalName,
        tradeName: data.tradeName,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone ?? null,
        responsibleName: data.responsibleName,
        address: data.address as object,
        users: {
          create: {
            email: data.adminUser.email.toLowerCase(),
            name: data.adminUser.name,
            passwordHash: data.adminUser.passwordHash,
            role: data.adminUser.role ?? UserRole.PROVIDER_ADMIN,
            status: data.adminUser.status ?? UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
          },
        },
      },
    });

    return created;
  }

  update(id: string, data: UpdateProviderData): Promise<ProviderEntity> {
    const updateData: {
      legalName?: string;
      tradeName?: string;
      phone?: string | null;
      responsibleName?: string;
      address?: Prisma.InputJsonValue;
    } = {
      ...(data.legalName !== undefined ? { legalName: data.legalName } : {}),
      ...(data.tradeName !== undefined ? { tradeName: data.tradeName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.responsibleName !== undefined ? { responsibleName: data.responsibleName } : {}),
      ...(data.address !== undefined ? { address: data.address as Prisma.InputJsonValue } : {}),
    };

    return this.prisma.provider.update({
      where: { id },
      data: updateData,
    });
  }

  updateStatus(id: string, status: ProviderStatus): Promise<ProviderEntity> {
    return this.prisma.provider.update({
      where: { id },
      data: { status },
    });
  }

  async countByStatus(): Promise<Record<ProviderStatus, number>> {
    const grouped = await this.prisma.provider.groupBy({
      by: ['status'],
      _count: true,
    });

    const result: Record<ProviderStatus, number> = {
      PENDING_VERIFICATION: 0,
      TRIAL_ACTIVE: 0,
      ACTIVE: 0,
      PAST_DUE: 0,
      SUSPENDED: 0,
      CANCELED: 0,
    };

    for (const item of grouped) {
      result[item.status] = item._count;
    }

    return result;
  }
}
