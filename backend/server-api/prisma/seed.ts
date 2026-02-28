import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to execute prisma seed.');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function seed(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingAdmin) {
    console.log('Admin já existe, pulando seed.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: 'Acception Admin',
      passwordHash,
      role: UserRole.ACCEPTION_ADMIN,
      status: UserStatus.ACTIVE,
      providerId: null,
      conveniadoId: null,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Admin criado com sucesso: ${email}`);
}

seed()
  .catch((error) => {
    console.error('Falha ao executar seed do admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
