import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../../common/decorators/public.decorator';

@Controller('api/health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
