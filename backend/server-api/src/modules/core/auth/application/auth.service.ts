import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { REFRESH_TOKEN_TTL_SECONDS } from '../../../../common/constants/auth.constants';
import { AuditService } from '../../audit/application/audit.service';
import { AuthRepository } from '../infrastructure/auth.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

interface LoginInput {
  email: string;
  password: string;
  ipAddress: string;
}

interface RefreshInput {
  refreshToken: string;
}

interface LogoutInput {
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
  ) {}

  async login(input: LoginInput) {
    const user = await this.repository.findUserByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = this.passwordService.verify(input.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not active');
    }

    if (user.provider.status === 'BLOCKED' || user.provider.status === 'SUSPENDED') {
      throw new ForbiddenException(
        user.provider.status === 'BLOCKED' ? 'Provider blocked' : 'Provider suspended',
      );
    }

    const roles = user.roles.map((roleBinding) => roleBinding.role.name);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      providerId: user.providerId,
      conveniadoId: user.conveniadoId,
      actorType: user.actorType,
      roles,
    });

    const refreshToken = randomUUID();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    await this.repository.createRefreshToken({
      tokenHash: refreshTokenHash,
      userId: user.id,
      providerId: user.providerId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    await this.auditService.log({
      providerId: user.providerId,
      userId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'user',
      entityId: user.id,
      details: {
        email: user.email,
      },
      ipAddress: input.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: this.serializeUser(user),
    };
  }

  async refresh(input: RefreshInput) {
    const refreshTokenHash = this.hashRefreshToken(input.refreshToken);
    const tokenRecord = await this.repository.findRefreshTokenByHash(refreshTokenHash);

    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const roles = tokenRecord.user.roles.map((roleBinding) => roleBinding.role.name);

    const accessToken = this.tokenService.generateAccessToken({
      sub: tokenRecord.user.id,
      providerId: tokenRecord.user.providerId,
      conveniadoId: tokenRecord.user.conveniadoId,
      actorType: tokenRecord.user.actorType,
      roles,
    });

    const newRefreshToken = randomUUID();
    const newRefreshTokenHash = this.hashRefreshToken(newRefreshToken);

    await this.repository.revokeRefreshToken(tokenRecord.id);
    await this.repository.createRefreshToken({
      tokenHash: newRefreshTokenHash,
      userId: tokenRecord.user.id,
      providerId: tokenRecord.user.providerId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(input: LogoutInput): Promise<void> {
    await this.repository.revokeAllUserRefreshTokens(input.userId);
  }

  async me(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.serializeUser(user);
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private serializeUser(user: {
    id: string;
    name: string;
    email: string;
    providerId: string;
    conveniadoId: string | null;
    actorType: string;
    roles: Array<{ role: { name: string } }>;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      providerId: user.providerId,
      conveniadoId: user.conveniadoId,
      actorType: user.actorType,
      roles: user.roles.map((roleBinding) => roleBinding.role.name),
    };
  }
}
