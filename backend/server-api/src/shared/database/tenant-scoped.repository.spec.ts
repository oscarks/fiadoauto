import { TenantScopedRepository } from './tenant-scoped.repository';
import { TenancyScopeError } from '../../modules/tenancy/domain/tenancy-scope.error';

interface Entity {
  id: string;
  providerId: string;
  name: string;
}

class TestTenantRepository extends TenantScopedRepository<
  Entity,
  { name: string; providerId?: string },
  { name?: string }
> {
  constructor() {
    super({
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: '1', providerId: 'provider-1', name: 'A' }),
      create: jest.fn().mockResolvedValue({ id: '1', providerId: 'provider-1', name: 'A' }),
      update: jest.fn().mockResolvedValue({ id: '1', providerId: 'provider-1', name: 'B' }),
    });
  }
}

describe('TenantScopedRepository', () => {
  it('should throw TenancyScopeError when providerId is missing', async () => {
    const repository = new TestTenantRepository();

    await expect(repository.findAll('')).rejects.toBeInstanceOf(TenancyScopeError);
  });
});
