import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator';
import { TokenService } from '../../modules/core/auth/application/token.service';
import type { AuthContext } from '../types/auth-context.type';

interface RequestWithAuth {
  headers: Record<string, string | string[] | undefined>;
  authContext?: AuthContext;
  user?: AuthContext;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const header = request.headers.authorization;

    if (!header || Array.isArray(header)) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const claims = this.tokenService.verifyAccessToken(token);
    request.authContext = claims;
    request.user = claims;

    return true;
  }
}
