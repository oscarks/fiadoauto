import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedRequestUser } from '../../auth/application/access-token-payload.type';
import { TenantContext } from '../../tenancy/domain/tenant-context';
import { CurrentTenant } from '../../tenancy/presentation/current-tenant.decorator';
import { Roles } from '../../rbac/presentation/roles.decorator';
import { GetProviderUseCase } from '../application/get-provider.use-case';
import { UpdateProviderUseCase } from '../application/update-provider.use-case';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Controller('providers')
@Roles(UserRole.PROVIDER_ADMIN)
export class ProviderController {
  constructor(
    private readonly getProviderUseCase: GetProviderUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
  ) {}

  @Get('me')
  me(@CurrentTenant() tenantContext: TenantContext) {
    return this.getProviderUseCase.execute(tenantContext.requireProviderId());
  }

  @Patch('me')
  updateMe(
    @CurrentTenant() tenantContext: TenantContext,
    @Body() body: UpdateProviderDto,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.updateProviderUseCase.execute(
      tenantContext.requireProviderId(),
      body,
      request.user.userId,
    );
  }
}
