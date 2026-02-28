import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UserRepositoryPort } from '../domain/auth.ports';
import { buildPaginatedResult } from '../../../shared/pagination/paginated-result';
import { AuthUser, AuthUserProfile, ManagedUser } from '../domain/auth.types';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(userId: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        providerId: true,
        conveniadoId: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
      },
    });
  }

  async findProfileById(userId: string): Promise<AuthUserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        provider: {
          select: {
            id: true,
            tradeName: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      providerId: user.providerId,
      conveniadoId: user.conveniadoId,
      provider: user.provider,
    };
  }

  async updateLastLoginAt(userId: string, date: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: date },
    });
  }

  async activateUser(userId: string, date: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: date,
      },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  findByIdInProvider(providerId: string, userId: string): Promise<ManagedUser | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, providerId },
      select: {
        id: true,
        providerId: true,
        conveniadoId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  async findAllByProvider(
    providerId: string,
    filters: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
      page: number;
      limit: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where = {
      providerId,
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' as const } },
              { email: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          providerId: true,
          conveniadoId: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(data, page, limit, total);
  }

  createInProvider(
    providerId: string,
    data: {
      email: string;
      passwordHash: string;
      name: string;
      role: UserRole;
      status: UserStatus;
    },
  ): Promise<ManagedUser> {
    return this.prisma.user.create({
      data: {
        providerId,
        conveniadoId: null,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        status: data.status,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        providerId: true,
        conveniadoId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  updateInProvider(
    providerId: string,
    userId: string,
    data: {
      name?: string;
      role?: UserRole;
      status?: UserStatus;
    },
  ): Promise<ManagedUser> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id: userId, providerId },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException('Usuário não encontrado no provider.');
      }

      return tx.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          providerId: true,
          conveniadoId: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });
    });
  }
}
