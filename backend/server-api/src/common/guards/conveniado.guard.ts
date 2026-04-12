import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../types/auth-context.type';

interface RequestWithAuth {
  authContext?: AuthContext;
  params: Record<string, string | undefined>;
  body?: Record<string, unknown>;
}

@Injectable()
export class ConveniadoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const auth = request.authContext;

    if (!auth) {
      throw new ForbiddenException('Missing auth context');
    }

    if (!auth.conveniadoId) {
      return true;
    }

    const candidateConveniadoId =
      request.params?.conveniadoId ??
      (typeof request.body?.conveniadoId === 'string' ? request.body.conveniadoId : undefined);

    if (!candidateConveniadoId) {
      return true;
    }

    if (candidateConveniadoId !== auth.conveniadoId) {
      throw new ForbiddenException('Conveniado scope mismatch');
    }

    return true;
  }
}
