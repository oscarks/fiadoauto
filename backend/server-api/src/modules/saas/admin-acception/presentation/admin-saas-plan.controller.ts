import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator';
import type { AuthContext } from '../../../../common/types/auth-context.type';
import { AdminAcceptService } from '../application/admin-acception.service';
import { CreateSaasPlanDto, ListSaasPlansDto, UpdateSaasPlanDto } from './dto/saas-plan.dto';

interface RequestWithAuth {
  ip: string;
  authContext?: AuthContext;
}

@Controller('api/admin/saas-plans')
@Roles('ACCEPTION_ADMIN')
export class AdminSaasPlanController {
  constructor(private readonly service: AdminAcceptService) {}

  @Get()
  listPlans(@Query() query: ListSaasPlansDto) {
    return this.service.listSaasPlans({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      isActive: query.isActive,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'DESC',
    });
  }

  @HttpCode(201)
  @Post()
  createPlan(@Body() body: CreateSaasPlanDto, @Req() request: RequestWithAuth) {
    return this.service.createSaasPlan({
      ...body,
      actorUserId: request.authContext!.sub,
      ipAddress: request.ip ?? 'unknown',
    });
  }

  @Patch(':id')
  updatePlan(
    @Param('id') id: string,
    @Body() body: UpdateSaasPlanDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.service.updateSaasPlan(
      id,
      body as Record<string, unknown>,
      request.authContext!.sub,
      request.ip ?? 'unknown',
    );
  }

  @Delete(':id')
  deletePlan(@Param('id') id: string, @Req() request: RequestWithAuth) {
    return this.service.deleteSaasPlan(
      id,
      request.authContext!.sub,
      request.ip ?? 'unknown',
    );
  }
}
