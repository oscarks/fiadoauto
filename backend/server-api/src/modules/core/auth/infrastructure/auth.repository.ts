import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../integrations/storage/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        provider: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        provider: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  createRefreshToken(input: {
    tokenHash: string;
    userId: string;
    providerId: string;
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
          include: {
            provider: true,
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
