import { Inject, Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { USER_REPOSITORY } from '../domain/auth.ports';
import type { UserRepositoryPort } from '../domain/auth.ports';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  execute(
    providerId: string,
    input: {
      page: number;
      limit: number;
      search?: string;
      role?: UserRole;
      status?: UserStatus;
    },
  ) {
    return this.userRepository.findAllByProvider(providerId, input);
  }
}
