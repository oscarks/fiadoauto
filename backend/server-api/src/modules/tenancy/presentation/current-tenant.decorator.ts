import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../domain/tenant-context';
import { TENANT_CONTEXT_KEY } from '../domain/tenant-context.constants';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext | undefined => {
    const request = ctx.switchToHttp().getRequest<{ [TENANT_CONTEXT_KEY]?: TenantContext }>();
    return request[TENANT_CONTEXT_KEY];
  },
);
