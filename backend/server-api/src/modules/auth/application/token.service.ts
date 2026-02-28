import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { REFRESH_TOKEN_REPOSITORY } from '../domain/auth.ports';
import type { RefreshTokenRepositoryPort } from '../domain/auth.ports';
import { AuthUser, RefreshTokenRecord } from '../domain/auth.types';
import { AccessTokenPayload } from './access-token-payload.type';

@Injectable()
export class TokenService {
  private readonly accessExpirationSeconds: number;
  private readonly refreshExpirationSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {
    this.accessExpirationSeconds = Number(configService.get<number>('JWT_ACCESS_EXPIRATION', 900));
    this.refreshExpirationSeconds = Number(
      configService.get<number>('JWT_REFRESH_EXPIRATION', 604800),
    );
  }

  generateAccessToken(user: AuthUser): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      providerId: user.providerId,
      conveniadoId: user.conveniadoId,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.accessExpirationSeconds,
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + this.refreshExpirationSeconds * 1000);

    await this.refreshTokenRepository.create(userId, token, expiresAt);

    return token;
  }

  async validateRefreshToken(token: string): Promise<RefreshTokenRecord> {
    const record = await this.refreshTokenRepository.findByToken(token);

    if (!record || record.revokedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    return record;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.revoke(token, new Date());
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllByUserId(userId, new Date());
  }

  getAccessExpirationSeconds(): number {
    return this.accessExpirationSeconds;
  }
}
