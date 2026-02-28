import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  HASHING_PORT,
  USER_REPOSITORY,
} from '../domain/auth.ports';
import type {
  EmailVerificationTokenRepositoryPort,
  HashingPort,
  UserRepositoryPort,
} from '../domain/auth.ports';
import { TokenService } from './token.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailTokenRepository: EmailVerificationTokenRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(HASHING_PORT) private readonly hashingService: HashingPort,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<{ message: string }> {
    if (!this.isStrongPassword(input.newPassword)) {
      throw new BadRequestException(
        'Senha fraca. Use no mínimo 8 caracteres, 1 letra maiúscula e 1 número.',
      );
    }

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

    const hashedPassword = await this.hashingService.hash(input.newPassword);
    const now = new Date();

    await this.prisma.$transaction(async () => {
      await this.emailTokenRepository.markUsed(input.token, now);
      await this.userRepository.updatePasswordHash(tokenRecord.userId, hashedPassword);
      await this.tokenService.revokeAllUserRefreshTokens(tokenRecord.userId);
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  private isStrongPassword(password: string): boolean {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }
}
