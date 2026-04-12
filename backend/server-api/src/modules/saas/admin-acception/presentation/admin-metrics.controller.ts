import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AdminAcceptService } from '../application/admin-acception.service';

@Controller('api/admin/metrics')
@Roles('ACCEPTION_ADMIN')
export class AdminMetricsController {
  constructor(private readonly service: AdminAcceptService) {}

  @Get()
  getMetrics() {
    return this.service.getMetrics();
  }
}
