import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { AuditModule } from '../../core/audit/audit.module';
import { PortalSolutionService } from './application/portal-solution.service';
import { PortalSolutionRepository } from './infrastructure/portal-solution.repository';
import { PortalSolutionController } from './presentation/portal-solution.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [PortalSolutionController],
  providers: [PortalSolutionService, PortalSolutionRepository],
})
export class PortalSolutionModule {}
