import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
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

interface ConfirmEmailInput {
  token: string;
}

interface ForgotPasswordInput {
  email: string;
}

interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

const ACTIVATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

const BLOCKED_STATUSES = [
  'SUSPENDED_SAAS_FULL',
  'SUSPENDED_SAAS_AUTH_ONLY',
  'CANCELLED',
];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
  ) {}

  async login(input: LoginInput) {
    const user = await this.repository.findUserByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const validPassword = this.passwordService.verify(input.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Usuário não está ativo. Confirme seu email.');
    }

    if (user.provider && BLOCKED_STATUSES.includes(user.provider.status)) {
      throw new ForbiddenException('Conta suspensa. Entre em contato com o suporte.');
    }

    const roles = user.roles.map((rb) => rb.role.name);

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
      actorUserId: user.id,
      actorType: user.actorType,
      action: 'AUTH_LOGIN',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email },
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
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const roles = tokenRecord.user.roles.map((rb) => rb.role.name);

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
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return this.serializeUser(user);
  }

  async confirmEmail(input: ConfirmEmailInput) {
    const user = await this.repository.findUserByActivationToken(input.token);

    if (!user) {
      throw new BadRequestException('Token de confirmação inválido');
    }

    if (user.tokenExpiresAt && user.tokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Token de confirmação expirado');
    }

    if (user.status === 'ACTIVE') {
      return { message: 'Email já confirmado' };
    }

    await this.repository.activateUser(user.id);

    // Activate provider if in PENDING_VERIFICATION
    if (user.provider && user.provider.status === 'PENDING_VERIFICATION') {
      const starterPlan = await this.repository.findStarterPlan();
      await this.repository.activateProvider(user.provider.id, starterPlan?.id ?? null);
    }

    return { message: 'Email confirmado com sucesso' };
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await this.repository.findUserByEmail(input.email);

    // Always return success to not leak email existence
    if (!user) {
      return { message: 'Se o email existir, um link de recuperação foi enviado' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.repository.setUserActivationToken(user.id, token, expiresAt);

    // TODO: Enviar email com link de reset (Sprint 9 - Notifications module)
    this.logger.log(`Password reset token for ${user.email}: ${token}`);

    return { message: 'Se o email existir, um link de recuperação foi enviado' };
  }

  async resetPassword(input: ResetPasswordInput) {
    const user = await this.repository.findUserByActivationToken(input.token);

    if (!user) {
      throw new BadRequestException('Token de reset inválido');
    }

    if (user.tokenExpiresAt && user.tokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Token de reset expirado');
    }

    const passwordHash = this.passwordService.hash(input.newPassword);
    await this.repository.updatePassword(user.id, passwordHash);

    // Revoke all refresh tokens for security
    await this.repository.revokeAllUserRefreshTokens(user.id);

    return { message: 'Senha alterada com sucesso' };
  }

  generateActivationToken(): { token: string; expiresAt: Date } {
    return {
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS),
    };
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private serializeUser(user: {
    id: string;
    name: string;
    email: string;
    providerId: string | null;
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
      roles: user.roles.map((rb) => rb.role.name),
    };
  }
}
