import { NotFoundException } from '@nestjs/common';
import { TenancyScopeError } from '../../modules/tenancy/domain/tenancy-scope.error';

interface TenantModelDelegate<T, TCreate, TUpdate, TWhere extends Record<string, unknown>> {
  findMany(args: { where: TWhere }): Promise<T[]>;
  findFirst(args: { where: TWhere }): Promise<T | null>;
  create(args: { data: TCreate }): Promise<T>;
  update(args: { where: { id: string }; data: TUpdate }): Promise<T>;
}

export abstract class TenantScopedRepository<
  T extends { id: string },
  TCreate extends Record<string, unknown>,
  TUpdate extends Record<string, unknown>,
  TWhere extends Record<string, unknown> = Record<string, unknown>,
> {
  protected constructor(
    protected readonly model: TenantModelDelegate<T, TCreate, TUpdate, TWhere>,
  ) {}

  async findAll(providerId: string, filters?: Record<string, unknown>): Promise<T[]> {
    this.assertProviderId(providerId);
    return this.model.findMany({
      where: ({ providerId, ...(filters ?? {}) } as unknown) as TWhere,
    });
  }

  async findById(providerId: string, id: string): Promise<T> {
    this.assertProviderId(providerId);

    const result = await this.model.findFirst({
      where: ({ id, providerId } as unknown) as TWhere,
    });
    if (!result) {
      throw new NotFoundException('Registro não encontrado no escopo do tenant.');
    }

    return result;
  }

  async create(providerId: string, data: TCreate): Promise<T> {
    this.assertProviderId(providerId);
    return this.model.create({
      data: { ...data, providerId } as TCreate,
    });
  }

  async update(providerId: string, id: string, data: TUpdate): Promise<T> {
    this.assertProviderId(providerId);
    await this.findById(providerId, id);
    return this.model.update({
      where: { id },
      data,
    });
  }

  protected assertProviderId(providerId: string): void {
    if (!providerId || providerId.trim().length === 0) {
      throw new TenancyScopeError();
    }
  }
}
