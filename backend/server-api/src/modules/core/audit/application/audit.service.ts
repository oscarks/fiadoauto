import { Injectable } from '@nestjs/common';
import { AuditRepository, CreateAuditLogInput } from '../infrastructure/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.repository.create(input);
  }
}
