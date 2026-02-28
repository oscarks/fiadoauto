import { Module } from '@nestjs/common';
import { RolesGuard } from './presentation/roles.guard';

@Module({
  imports: [],
  controllers: [],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class RbacModule {}
