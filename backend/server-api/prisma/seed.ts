import { randomBytes, pbkdf2Sync } from 'crypto';
import { PrismaClient, ActorType, ProviderStatus, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const iterations = 120000;
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

async function main(): Promise<void> {
  const acceptionProvider = await prisma.provider.upsert({
    where: { cnpj: '00000000000000' },
    update: {},
    create: {
      name: 'Acception Platform',
      tradeName: 'Acception',
      cnpj: '00000000000000',
      email: 'admin@acception.com',
      phone: '0000000000',
      status: ProviderStatus.ACTIVE,
      activatedAt: new Date(),
    },
  });

  const role = await prisma.role.upsert({
    where: { name: 'ACCEPTION_ADMIN' },
    update: {},
    create: {
      name: 'ACCEPTION_ADMIN',
      description: 'Administrador global do SaaS',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'admin@acception.com' },
    update: {},
    create: {
      name: 'Acception Admin',
      email: 'admin@acception.com',
      passwordHash: hashPassword('Admin@123'),
      providerId: acceptionProvider.id,
      status: UserStatus.ACTIVE,
      actorType: ActorType.ACCEPTION_USER,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
