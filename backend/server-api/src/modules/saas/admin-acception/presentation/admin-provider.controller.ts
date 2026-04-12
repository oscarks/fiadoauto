import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator';
import type { AuthContext } from '../../../../common/types/auth-context.type';
import { AdminAcceptService } from '../application/admin-acception.service';
import { ListProvidersDto } from './dto/list-providers.dto';
import {
  ActivateSubscriptionDto,
  SuspendProviderDto,
  ReactivateProviderDto,
} from './dto/admin-actions.dto';

interface RequestWithAuth {
  ip: string;
  authContext?: AuthContext;
}

@Controller('api/admin/providers')
@Roles('ACCEPTION_ADMIN')
export class AdminProviderController {
  constructor(private readonly service: AdminAcceptService) {}

  @Get()
  listProviders(@Query() query: ListProvidersDto) {
    return this.service.listProviders({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
      planId: query.planId,
      search: query.search,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'DESC',
    });
  }

  @Get(':id')
  getProviderDetail(@Param('id') id: string) {
    return this.service.getProviderDetail(id);
  }

  @Post(':id/activate-subscription')
  activateSubscription(
    @Param('id') id: string,
    @Body() body: ActivateSubscriptionDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.service.activateSubscription(
      id,
      body,
      request.authContext!.sub,
      request.ip ?? 'unknown',
    );
  }

  @Post(':id/suspend')
  suspendProvider(
    @Param('id') id: string,
    @Body() body: SuspendProviderDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.service.suspendProvider(
      id,
      body,
      request.authContext!.sub,
      request.ip ?? 'unknown',
    );
  }

  @Post(':id/reactivate')
  reactivateProvider(
    @Param('id') id: string,
    @Body() body: ReactivateProviderDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.service.reactivateProvider(
      id,
      body,
      request.authContext!.sub,
      request.ip ?? 'unknown',
    );
  }
}
