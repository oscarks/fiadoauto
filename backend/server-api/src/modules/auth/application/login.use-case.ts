import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { HASHING_PORT, USER_REPOSITORY } from '../domain/auth.ports';
import type { HashingPort, UserRepositoryPort } from '../domain/auth.ports';
import { LoginRateLimiter } from './login-rate-limiter.service';
import { TokenService } from './token.service';

interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokensOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(HASHING_PORT) private readonly hashingService: HashingPort,
    private readonly tokenService: TokenService,
    private readonly rateLimiter: LoginRateLimiter,
  ) {}

  private static readonly DUMMY_HASH =
    '$2b$12$LJ3m4ys3Lk0TSwHjjMgLxuVn0bM.ePqzPBz0dYQ1c5X9Y1v7fWsGu';

  async execute(input: LoginInput): Promise<AuthTokensOutput> {
    this.rateLimiter.check(input.email);

    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      // Dummy compare to prevent timing-based user enumeration
      await this.hashingService.compare(input.password, LoginUseCase.DUMMY_HASH);
      this.rateLimiter.registerFailure(input.email);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const matches = await this.hashingService.compare(input.password, user.passwordHash);
    if (!matches) {
      this.rateLimiter.registerFailure(input.email);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Password is correct — now check status
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException('Email não verificado.');
    }

    this.rateLimiter.registerSuccess(input.email);

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);
    await this.userRepository.updateLastLoginAt(user.id, new Date());

    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokenService.getAccessExpirationSeconds(),
    };
  }
}
