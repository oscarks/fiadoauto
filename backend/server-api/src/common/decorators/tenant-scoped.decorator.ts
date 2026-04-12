import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthContext } from '../types/auth-context.type';

interface RequestWithAuth {
  authContext?: AuthContext;
}

export const TenantScoped = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
    return request.authContext?.providerId;
  },
);
