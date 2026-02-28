import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(() => {
    process.env.DATABASE_URL ??=
      'postgresql://postgres:postgres@localhost:5432/fiadoauto?schema=public';
    prismaService = new PrismaService();
  });

  it('should connect on module init', async () => {
    const connectSpy = jest
      .spyOn(prismaService, '$connect')
      .mockResolvedValueOnce(undefined as never);

    await prismaService.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('should disconnect on module destroy', async () => {
    const disconnectSpy = jest
      .spyOn(prismaService, '$disconnect')
      .mockResolvedValueOnce(undefined as never);

    await prismaService.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
