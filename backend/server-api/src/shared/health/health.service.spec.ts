import { HealthService } from './health.service';

describe('HealthService', () => {
  it('should return healthy status when database is reachable', async () => {
    const prismaMock = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new HealthService(prismaMock as never);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
    expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
  });
});
