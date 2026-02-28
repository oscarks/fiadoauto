import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequestUser } from '../../auth/application/access-token-payload.type';
import { IS_PUBLIC_METADATA_KEY } from '../../rbac/presentation/metadata.constants';
import { TenantContext } from '../domain/tenant-context';
import { TENANT_CONTEXT_KEY } from '../domain/tenant-context.constants';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedRequestUser;
      query?: { providerId?: string };
      [TENANT_CONTEXT_KEY]?: TenantContext;
    }>();
    const authUser = request.user;

    if (!authUser) {
      throw new UnauthorizedException();
    }

    const actorType = this.resolveActorType(authUser.role);
    const tenantContext = new TenantContext(
      authUser.providerId,
      authUser.conveniadoId,
      authUser.userId,
      authUser.role,
      actorType,
    );

    if (tenantContext.isAcception() && request.query?.providerId) {
      tenantContext.providerId = request.query.providerId;
    }

    request[TENANT_CONTEXT_KEY] = tenantContext;
    return true;
  }

  private resolveActorType(role: UserRole): 'PROVIDER' | 'CONVENIADO' | 'ACCEPTION' {
    if (role === UserRole.ACCEPTION_ADMIN) {
      return 'ACCEPTION';
    }
    if (role === UserRole.CONVENIADO_ADMIN) {
      return 'CONVENIADO';
    }
    return 'PROVIDER';
  }
}
