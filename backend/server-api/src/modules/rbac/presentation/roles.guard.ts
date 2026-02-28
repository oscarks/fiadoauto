import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from '../../tenancy/domain/tenant-context';
import { TENANT_CONTEXT_KEY } from '../../tenancy/domain/tenant-context.constants';
import { IS_PUBLIC_METADATA_KEY, ROLES_METADATA_KEY } from './metadata.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ [TENANT_CONTEXT_KEY]?: TenantContext }>();
    const tenantContext = request[TENANT_CONTEXT_KEY];

    if (!tenantContext || !requiredRoles.includes(tenantContext.role)) {
      throw new ForbiddenException('Acesso não autorizado para este role.');
    }

    return true;
  }
}
