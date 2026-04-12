import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator';
import { IS_REFUEL_ROUTE } from '../decorators/refuel-route.decorator';
import { PrismaService } from '../../modules/integrations/storage/prisma/prisma.service';
import { AuthContext } from '../types/auth-context.type';

@Injectable()
export class SuspensionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authContext: AuthContext | undefined = request.authContext;
    if (!authContext?.providerId) return true;

    // Acception admins bypass suspension check
    if (authContext.actorType === 'ACCEPTION_ADMIN') return true;

    const provider = await this.prisma.provider.findUnique({
      where: { id: authContext.providerId },
      select: { status: true },
    });

    if (!provider) return true;

    if (provider.status === 'SUSPENDED_SAAS_FULL') {
      throw new ForbiddenException(
        'Sua conta está suspensa. Entre em contato com o suporte.',
      );
    }

    if (provider.status === 'SUSPENDED_SAAS_AUTH_ONLY') {
      const isRefuelRoute = this.reflector.getAllAndOverride<boolean>(
        IS_REFUEL_ROUTE,
        [context.getHandler(), context.getClass()],
      );

      if (isRefuelRoute) {
        throw new ForbiddenException(
          'Autorizações de abastecimento suspensas por inadimplência. Entre em contato com o suporte.',
        );
      }
    }

    return true;
  }
}
