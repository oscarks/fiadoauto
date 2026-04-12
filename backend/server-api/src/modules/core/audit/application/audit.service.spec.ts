jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('appends audit logs without mutations', async () => {
    const repository = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AuditService(repository as never);

    await service.log({
      providerId: 'provider-1',
      userId: 'user-1',
      action: 'AUTH_LOGIN',
      entityType: 'user',
      details: { source: 'unit-test' },
      ipAddress: '127.0.0.1',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'provider-1',
        userId: 'user-1',
        action: 'AUTH_LOGIN',
      }),
    );
  });
});
