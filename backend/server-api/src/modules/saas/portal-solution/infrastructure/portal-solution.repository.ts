import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../integrations/storage/prisma/prisma.service';

@Injectable()
export class PortalSolutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProviderByCnpj(cnpj: string) {
    return this.prisma.provider.findUnique({
      where: { cnpj },
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  findRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async createProviderWithAdmin(input: {
    provider: {
      legalName: string;
      tradeName: string;
      cnpj: string;
      email: string;
      phone?: string;
      addressJson?: Record<string, unknown>;
    };
    admin: {
      name: string;
      email: string;
      passwordHash: string;
      activationToken: string;
      tokenExpiresAt: Date;
    };
    roleId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.create({
        data: {
          legalName: input.provider.legalName,
          tradeName: input.provider.tradeName,
          cnpj: input.provider.cnpj,
          email: input.provider.email,
          phone: input.provider.phone,
          addressJson: input.provider.addressJson ?? undefined,
          status: 'PENDING_VERIFICATION',
        },
      });

      const user = await tx.user.create({
        data: {
          name: input.admin.name,
          email: input.admin.email,
          passwordHash: input.admin.passwordHash,
          providerId: provider.id,
          actorType: 'PROVIDER_USER',
          status: 'PENDING_EMAIL_CONFIRMATION',
          activationToken: input.admin.activationToken,
          tokenExpiresAt: input.admin.tokenExpiresAt,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: input.roleId,
        },
      });

      return { provider, user };
    });
  }

  findActiveSaasPlans() {
    return this.prisma.saasPlan.findMany({
      where: { isActive: true },
      orderBy: { baseMonthlyPrice: 'asc' },
    });
  }
}
