import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedRequestUser } from '../../auth/application/access-token-payload.type';
import { Roles } from '../../rbac/presentation/roles.decorator';
import { ChangeProviderStatusUseCase } from '../application/change-provider-status.use-case';
import { CreateProviderUseCase } from '../application/create-provider.use-case';
import { GetProviderUseCase } from '../application/get-provider.use-case';
import { ListProvidersUseCase } from '../application/list-providers.use-case';
import { ChangeProviderStatusDto, CreateProviderDto } from './dto/create-provider.dto';
import { ProviderListQueryDto } from './dto/provider-list-query.dto';

@Controller('admin/providers')
@Roles(UserRole.ACCEPTION_ADMIN)
export class AdminProviderController {
  constructor(
    private readonly listProvidersUseCase: ListProvidersUseCase,
    private readonly getProviderUseCase: GetProviderUseCase,
    private readonly createProviderUseCase: CreateProviderUseCase,
    private readonly changeProviderStatusUseCase: ChangeProviderStatusUseCase,
  ) {}

  @Get()
  list(@Query() query: ProviderListQueryDto) {
    return this.listProvidersUseCase.execute(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.getProviderUseCase.execute(id);
  }

  @Post()
  create(
    @Body() body: CreateProviderDto,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.createProviderUseCase.execute({
      ...body,
      actorUserId: request.user.userId,
    });
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeProviderStatusDto,
    @Req() request: Request & { user: AuthenticatedRequestUser },
  ) {
    return this.changeProviderStatusUseCase.execute(id, body.status, request.user.userId);
  }
}
