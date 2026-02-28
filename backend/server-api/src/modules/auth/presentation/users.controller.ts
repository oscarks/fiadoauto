import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedRequestUser } from '../application/access-token-payload.type';
import { BlockUserUseCase } from '../application/block-user.use-case';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { DeactivateUserUseCase } from '../application/deactivate-user.use-case';
import { GetUserUseCase } from '../application/get-user.use-case';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { UnblockUserUseCase } from '../application/unblock-user.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import { Roles } from '../../rbac/presentation/roles.decorator';
import { TenantContext } from '../../tenancy/domain/tenant-context';
import { CurrentTenant } from '../../tenancy/presentation/current-tenant.decorator';
import { CreateUserDto, UpdateUserDto, UserListQueryDto } from './dto/user-management.dto';

@Controller('users')
@Roles(UserRole.PROVIDER_ADMIN)
export class UsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly blockUserUseCase: BlockUserUseCase,
    private readonly unblockUserUseCase: UnblockUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
  ) {}

  @Get()
  list(@CurrentTenant() tenantContext: TenantContext, @Query() query: UserListQueryDto) {
    return this.listUsersUseCase.execute(tenantContext.requireProviderId(), query);
  }

  @Get(':id')
  detail(@CurrentTenant() tenantContext: TenantContext, @Param('id') id: string) {
    return this.getUserUseCase.execute(tenantContext.requireProviderId(), id);
  }

  @Post()
  create(
    @CurrentTenant() tenantContext: TenantContext,
    @Body() body: CreateUserDto,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.createUserUseCase.execute(
      tenantContext.requireProviderId(),
      body,
      request.user.userId,
    );
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantContext: TenantContext,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.updateUserUseCase.execute(
      tenantContext.requireProviderId(),
      id,
      body,
      request.user.userId,
    );
  }

  @Post(':id/block')
  block(
    @CurrentTenant() tenantContext: TenantContext,
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.blockUserUseCase.execute(
      tenantContext.requireProviderId(),
      id,
      request.user.userId,
    );
  }

  @Post(':id/unblock')
  unblock(
    @CurrentTenant() tenantContext: TenantContext,
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.unblockUserUseCase.execute(
      tenantContext.requireProviderId(),
      id,
      request.user.userId,
    );
  }

  @Delete(':id')
  deactivate(
    @CurrentTenant() tenantContext: TenantContext,
    @Param('id') id: string,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.deactivateUserUseCase.execute(
      tenantContext.requireProviderId(),
      id,
      request.user.userId,
    );
  }
}
