import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthContext } from '../../../../common/types/auth-context.type';
import { ACCESS_TOKEN_TTL_SECONDS } from '../../../../common/constants/auth.constants';

interface AccessTokenPayload {
  sub: string;
  providerId: string;
  conveniadoId?: string | null;
  actorType: string;
  roles: string[];
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  }

  verifyAccessToken(token: string): AuthContext {
    try {
      return this.jwtService.verify<AuthContext>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
