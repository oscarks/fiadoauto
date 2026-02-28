import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  EMAIL_PORT,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../domain/auth.ports';
import type {
  EmailPort,
  EmailVerificationTokenRepositoryPort,
  UserRepositoryPort,
} from '../domain/auth.ports';

interface ForgotPasswordInput {
  email: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailTokenRepository: EmailVerificationTokenRepositoryPort,
    @Inject(EMAIL_PORT) private readonly emailPort: EmailPort,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(input.email);

    if (user) {
      const now = new Date();
      await this.emailTokenRepository.invalidateUnusedByUserId(user.id, now);

      const token = randomUUID();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      await this.emailTokenRepository.create(user.id, token, expiresAt);

      await this.emailPort.send(user.email, 'PASSWORD_RESET', {
        token,
        userName: user.name,
      });
    }

    return { message: 'Se o email existir, instruções foram enviadas.' };
  }
}
