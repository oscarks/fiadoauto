import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY } from '../domain/auth.ports';
import type { UserRepositoryPort } from '../domain/auth.ports';
import { AuthUserProfile } from '../domain/auth.types';

@Injectable()
export class GetMeUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort) {}

  async execute(userId: string): Promise<AuthUserProfile> {
    const profile = await this.userRepository.findProfileById(userId);

    if (!profile) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return profile;
  }
}
