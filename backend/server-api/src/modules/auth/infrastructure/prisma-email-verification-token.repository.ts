import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailVerificationTokenRepositoryPort } from '../domain/auth.ports';
import { EmailVerificationTokenRecord } from '../domain/auth.types';

@Injectable()
export class PrismaEmailVerificationTokenRepository implements EmailVerificationTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  findByToken(token: string): Promise<EmailVerificationTokenRecord | null> {
    return this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });
  }

  async markUsed(token: string, usedAt: Date): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { token },
      data: { usedAt },
    });
  }

  async invalidateUnusedByUserId(userId: string, usedAt: Date): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt,
      },
    });
  }
}
