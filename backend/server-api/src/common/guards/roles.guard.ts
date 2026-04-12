import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthContext } from '../types/auth-context.type';

interface RequestWithAuth {
  authContext?: AuthContext;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const auth = request.authContext;

    if (!auth) {
      throw new ForbiddenException('Missing auth context');
    }

    const allowed = requiredRoles.some((role) => auth.roles.includes(role));
    if (!allowed) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
