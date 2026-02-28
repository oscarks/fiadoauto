import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { USER_REPOSITORY } from '../domain/auth.ports';
import type { UserRepositoryPort } from '../domain/auth.ports';
import { TokenService } from './token.service';

interface RefreshInput {
  refreshToken: string;
}

interface AuthTokensOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RefreshInput): Promise<AuthTokensOutput> {
    const refreshRecord = await this.tokenService.validateRefreshToken(input.refreshToken);
    await this.tokenService.revokeRefreshToken(input.refreshToken);

    const user = await this.userRepository.findById(refreshRecord.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário inválido.');
    }

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokenService.getAccessExpirationSeconds(),
    };
  }
}
