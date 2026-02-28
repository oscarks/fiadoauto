import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { AuditService } from '../../audit/application/audit.service';
import { HASHING_PORT, USER_REPOSITORY } from '../domain/auth.ports';
import type { HashingPort, UserRepositoryPort } from '../domain/auth.ports';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(HASHING_PORT) private readonly hashingService: HashingPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    providerId: string,
    input: {
      email: string;
      name: string;
      password: string;
      role: UserRole;
    },
    actorUserId?: string,
  ) {
    const allowedRoles = new Set<UserRole>([
      UserRole.PROVIDER_OPERATOR,
      UserRole.PROVIDER_MANAGER,
    ]);
    if (!allowedRoles.has(input.role)) {
      throw new ForbiddenException('Não é possível criar usuário com este role.');
    }

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado.');
    }

    const passwordHash = await this.hashingService.hash(input.password);

    try {
      const user = await this.userRepository.createInProvider(providerId, {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role,
        status: UserStatus.ACTIVE,
      });

      await this.auditService.log({
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        providerId,
        userId: actorUserId ?? null,
        newValue: user,
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email já cadastrado.');
      }
      if (error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Falha ao criar usuário.');
    }
  }
}
