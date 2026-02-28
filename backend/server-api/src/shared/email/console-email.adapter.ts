import { Injectable, Logger } from '@nestjs/common';
import { EmailPort } from '../../modules/auth/domain/auth.ports';

@Injectable()
export class ConsoleEmailAdapter implements EmailPort {
  private readonly logger = new Logger(ConsoleEmailAdapter.name);

  async send(
    to: string,
    templateCode: string,
    variables: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(`[EMAIL] To: ${to} | Template: ${templateCode}`);
    this.logger.log(`[EMAIL] Variables: ${JSON.stringify(variables)}`);
  }
}
