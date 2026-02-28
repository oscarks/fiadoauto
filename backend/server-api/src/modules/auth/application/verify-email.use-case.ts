import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../domain/auth.ports';
import type { EmailVerificationTokenRepositoryPort, UserRepositoryPort } from '../domain/auth.ports';
import { PrismaService } from '../../../shared/prisma/prisma.service';

interface VerifyEmailInput {
  token: string;
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailTokenRepository: EmailVerificationTokenRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: VerifyEmailInput): Promise<{ message: string }> {
    const tokenRecord = await this.emailTokenRepository.findByToken(input.token);

    if (!tokenRecord) {
      throw new BadRequestException('Token inválido.');
    }
    if (tokenRecord.usedAt) {
      throw new BadRequestException('Token já utilizado.');
    }
    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Token expirado.');
    }

    const now = new Date();
    await this.prisma.$transaction(async () => {
      await this.emailTokenRepository.markUsed(input.token, now);
      await this.userRepository.activateUser(tokenRecord.userId, now);
    });

    return { message: 'Email verificado com sucesso.' };
  }
}
