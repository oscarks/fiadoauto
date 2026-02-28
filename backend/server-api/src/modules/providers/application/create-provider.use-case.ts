import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { HASHING_PORT } from '../../auth/domain/auth.ports';
import type { HashingPort } from '../../auth/domain/auth.ports';
import { AuditService } from '../../audit/application/audit.service';
import { PROVIDER_REPOSITORY } from '../domain/provider.ports';
import type { ProviderRepositoryPort } from '../domain/provider.ports';
import { isValidCnpj, normalizeCnpj } from './cnpj.util';

@Injectable()
export class CreateProviderUseCase {
  constructor(
    @Inject(PROVIDER_REPOSITORY)
    private readonly providerRepository: ProviderRepositoryPort,
    @Inject(HASHING_PORT) private readonly hashingService: HashingPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(input: {
    legalName: string;
    tradeName: string;
    cnpj: string;
    email: string;
    phone?: string;
    responsibleName: string;
    address: unknown;
    adminUser: {
      email: string;
      name: string;
      password: string;
    };
    actorUserId?: string;
  }) {
    const normalizedCnpj = normalizeCnpj(input.cnpj);
    if (!isValidCnpj(normalizedCnpj)) {
      throw new UnprocessableEntityException('CNPJ inválido.');
    }

    try {
      const passwordHash = await this.hashingService.hash(input.adminUser.password);
      const provider = await this.providerRepository.create({
        legalName: input.legalName,
        tradeName: input.tradeName,
        cnpj: normalizedCnpj,
        email: input.email.toLowerCase(),
        phone: input.phone,
        responsibleName: input.responsibleName,
        address: input.address,
        adminUser: {
          email: input.adminUser.email.toLowerCase(),
          name: input.adminUser.name,
          passwordHash,
          role: UserRole.PROVIDER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      await this.auditService.log({
        action: 'PROVIDER_CREATED',
        entity: 'Provider',
        entityId: provider.id,
        providerId: provider.id,
        userId: input.actorUserId ?? null,
        newValue: {
          id: provider.id,
          tradeName: provider.tradeName,
          status: provider.status,
        },
      });

      return provider;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Provider com esse CNPJ ou email já existe.');
      }
      if (
        error instanceof ConflictException ||
        error instanceof UnprocessableEntityException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Falha ao criar provider.');
    }
  }
}
