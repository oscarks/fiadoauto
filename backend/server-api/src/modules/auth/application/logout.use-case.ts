import { Injectable } from '@nestjs/common';
import { TokenService } from './token.service';

interface LogoutInput {
  refreshToken: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(private readonly tokenService: TokenService) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.tokenService.revokeRefreshToken(input.refreshToken);
  }
}
