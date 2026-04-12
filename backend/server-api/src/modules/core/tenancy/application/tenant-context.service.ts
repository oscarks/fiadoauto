import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { AuthContext } from '../../../../common/types/auth-context.type';

interface RequestWithAuth {
  authContext?: AuthContext;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: RequestWithAuth) {}

  get providerId(): string | null | undefined {
    return this.request.authContext?.providerId;
  }

  get conveniadoId(): string | null | undefined {
    return this.request.authContext?.conveniadoId;
  }

  get roles(): string[] {
    return this.request.authContext?.roles ?? [];
  }
}
