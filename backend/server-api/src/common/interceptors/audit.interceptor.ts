import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_ACTION_KEY } from '../decorators/audited.decorator';
import { AuditService } from '../../modules/core/audit/application/audit.service';
import type { AuthContext } from '../types/auth-context.type';

interface RequestWithAudit {
  method: string;
  originalUrl: string;
  ip: string;
  authContext?: AuthContext;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithAudit>();

    return next.handle().pipe(
      tap(async () => {
        if (!request.authContext) {
          return;
        }

        await this.auditService.log({
          providerId: request.authContext.providerId,
          actorUserId: request.authContext.sub,
          actorType: request.authContext.actorType,
          action,
          entityType: 'http_request',
          details: {
            method: request.method,
            path: request.originalUrl,
          },
          ipAddress: request.ip ?? 'unknown',
        });
      }),
    );
  }
}
