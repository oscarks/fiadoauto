import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../types/auth-context.type';

interface RequestWithAuth {
  authContext?: AuthContext;
  params: Record<string, string | undefined>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const auth = request.authContext;

    if (!auth) {
      throw new ForbiddenException('Missing auth context');
    }

    const candidateProviderId =
      request.params?.providerId ??
      (typeof request.body?.providerId === 'string' ? request.body.providerId : undefined) ??
      (typeof request.query?.providerId === 'string' ? request.query.providerId : undefined);

    if (!candidateProviderId) {
      return true;
    }

    if (candidateProviderId !== auth.providerId) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    return true;
  }
}
