import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/fiadoauto?schema=public';
process.env.JWT_SECRET ??= 'test-super-secret-key-with-at-least-32-chars';
process.env.SEED_ADMIN_PASSWORD ??= 'Admin@123';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/fiadoauto?schema=public',
    });
    prisma = new PrismaClient({
      adapter: new PrismaPg(pool),
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
    await app.close();
  });

  it('POST /auth/login should return tokens with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('expiresIn');
  });

  it('POST /auth/login should return 401 with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('GET /auth/me should return profile for authenticated user', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);
  });

  it('POST /auth/refresh should rotate tokens', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
      })
      .expect(200);

    const refreshToken = loginResponse.body.refreshToken as string;
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('POST /auth/logout should revoke refresh token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;
    const refreshToken = loginResponse.body.refreshToken as string;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('POST /auth/login should return 429 after too many failures', async () => {
    const unknownEmail = `blocked-${Date.now()}@acception.com`;

    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: unknownEmail,
          password: 'wrong-password',
        })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: unknownEmail,
        password: 'wrong-password',
      })
      .expect(429);
  });

  it('POST /auth/verify-email should activate pending user', async () => {
    const email = `verify-${Date.now()}@acception.com`;
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'Verify User',
        role: UserRole.ACCEPTION_ADMIN,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerifiedAt: null,
      },
    });
    const token = randomUUID();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await request(app.getHttpServer()).post('/auth/verify-email').send({ token }).expect(200);

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updatedUser?.status).toBe(UserStatus.ACTIVE);

    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('forgot/reset password flow should allow login with new password', async () => {
    const email = `reset-${Date.now()}@acception.com`;
    const oldPassword = 'OldPass123';
    const newPassword = 'NewPass123';
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(oldPassword, 12),
        name: 'Reset User',
        role: UserRole.ACCEPTION_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    await request(app.getHttpServer()).post('/auth/forgot-password').send({ email }).expect(200);

    const tokenRecord = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(tokenRecord?.token).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: tokenRecord?.token,
        newPassword,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: newPassword,
      })
      .expect(200);

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
