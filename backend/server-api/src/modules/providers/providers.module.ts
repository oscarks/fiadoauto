import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { HASHING_PORT } from '../auth/domain/auth.ports';
import { BcryptHashingAdapter } from '../auth/infrastructure/bcrypt-hashing.adapter';
import { ChangeProviderStatusUseCase } from './application/change-provider-status.use-case';
import { CreateProviderUseCase } from './application/create-provider.use-case';
import { GetProviderUseCase } from './application/get-provider.use-case';
import { ListProvidersUseCase } from './application/list-providers.use-case';
import { UpdateProviderUseCase } from './application/update-provider.use-case';
import { PROVIDER_REPOSITORY } from './domain/provider.ports';
import { PrismaProviderRepository } from './infrastructure/prisma-provider.repository';
import { AdminProviderController } from './presentation/admin-provider.controller';
import { ProviderController } from './presentation/provider.controller';

@Module({
  imports: [AuditModule],
  controllers: [AdminProviderController, ProviderController],
  providers: [
    ListProvidersUseCase,
    GetProviderUseCase,
    CreateProviderUseCase,
    UpdateProviderUseCase,
    ChangeProviderStatusUseCase,
    {
      provide: PROVIDER_REPOSITORY,
      useClass: PrismaProviderRepository,
    },
    {
      provide: HASHING_PORT,
      useClass: BcryptHashingAdapter,
    },
  ],
  exports: [],
})
export class ProvidersModule {}
