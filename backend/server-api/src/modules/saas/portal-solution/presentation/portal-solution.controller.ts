import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { Public } from '../../../../common/decorators/public.decorator';
import { PortalSolutionService } from '../application/portal-solution.service';
import { RegisterProviderDto } from './dto/register-provider.dto';

interface RequestWithIp {
  ip: string;
}

@Controller('api/providers')
export class PortalSolutionController {
  constructor(private readonly service: PortalSolutionService) {}

  @Public()
  @HttpCode(201)
  @Post('register')
  register(@Body() body: RegisterProviderDto, @Req() request: RequestWithIp) {
    return this.service.registerProvider({
      legalName: body.legalName,
      tradeName: body.tradeName,
      cnpj: body.cnpj,
      email: body.email,
      phone: body.phone,
      address: body.address,
      admin: body.admin,
      acceptTerms: body.acceptTerms,
      ipAddress: request.ip ?? 'unknown',
    });
  }

  @Public()
  @Get('plans')
  listPlans() {
    return this.service.listPlans();
  }
}
