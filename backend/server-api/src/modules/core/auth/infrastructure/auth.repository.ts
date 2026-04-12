import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../integrations/storage/prisma/prisma.service';

const USER_WITH_PROVIDER_AND_ROLES = {
  provider: true,
  roles: {
    include: {
      role: true,
    },
  },
} as const;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: USER_WITH_PROVIDER_AND_ROLES,
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: USER_WITH_PROVIDER_AND_ROLES,
    });
  }

  findUserByActivationToken(token: string) {
    return this.prisma.user.findFirst({
      where: { activationToken: token },
      include: USER_WITH_PROVIDER_AND_ROLES,
    });
  }

  async activateUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        activationToken: null,
        tokenExpiresAt: null,
      },
    });
  }

  async activateProvider(providerId: string, starterPlanId: string | null): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.provider.update({
        where: { id: providerId },
        data: { status: 'TRIAL_ACTIVE' },
      });

      if (starterPlanId) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        await tx.subscription.upsert({
          where: { providerId },
          update: {},
          create: {
            providerId,
            planId: starterPlanId,
            status: SubscriptionStatus.TRIAL,
            trialEndsAt,
          },
        });
      }
    });
  }

  findStarterPlan() {
    return this.prisma.saasPlan.findUnique({
      where: { code: 'STARTER' },
    });
  }

  async setUserActivationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        activationToken: token,
        tokenExpiresAt: expiresAt,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        activationToken: null,
        tokenExpiresAt: null,
      },
    });
  }

  createRefreshToken(input: {
    tokenHash: string;
    userId: string;
    providerId: string | null;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({
      data: {
        tokenHash: input.tokenHash,
        userId: input.userId,
        providerId: input.providerId,
        expiresAt: input.expiresAt,
      },
    });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: USER_WITH_PROVIDER_AND_ROLES,
        },
      },
    });
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
