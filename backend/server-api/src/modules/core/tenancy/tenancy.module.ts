import { Module } from '@nestjs/common';
import { TenantContextService } from './application/tenant-context.service';

@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenancyModule {}
