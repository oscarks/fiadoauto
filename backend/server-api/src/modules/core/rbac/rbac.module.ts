import { Module } from '@nestjs/common';
import { RbacService } from './application/rbac.service';

@Module({
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
