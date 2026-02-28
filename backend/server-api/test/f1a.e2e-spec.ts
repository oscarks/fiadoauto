import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/fiadoauto?schema=public';
process.env.JWT_SECRET ??= 'test-super-secret-key-with-at-least-32-chars';
process.env.SEED_ADMIN_PASSWORD ??= 'Admin@123';

function makeValidCnpj(seed: number): string {
  const base = `12345678${String(seed).padStart(4, '0')}`; // 12 digits
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, ...firstWeights];
  const calc = (digits: string, weights: number[]) => {
    const sum = digits
      .split('')
      .reduce((acc, value, index) => acc + Number(value) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const d1 = calc(base, firstWeights);
  const d2 = calc(`${base}${d1}`, secondWeights);
  return `${base}${d1}${d2}`;
}

describe('F1A Sprint 4 (e2e)', () => {
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

  it('admin flow: login, create provider, list and detail', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
      })
      .expect(200);
    const adminToken = adminLogin.body.accessToken as string;

    const suffix = Date.now();
    const providerAdminEmail = `provider-admin-${suffix}@acception.com`;
    const providerAdminPassword = 'Provider@123';
    const providerCreate = await request(app.getHttpServer())
      .post('/admin/providers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        legalName: `Posto ${suffix} LTDA`,
        tradeName: `Posto ${suffix}`,
        cnpj: makeValidCnpj(suffix % 9000),
        email: `contato-${suffix}@posto.com`,
        phone: '11999990000',
        responsibleName: 'Responsavel Teste',
        address: {
          street: 'Rua A',
          number: '100',
          city: 'Sao Paulo',
          state: 'SP',
          zipCode: '01001000',
        },
        adminUser: {
          email: providerAdminEmail,
          name: 'Admin Provider',
          password: providerAdminPassword,
        },
      })
      .expect(201);

    const providerId = providerCreate.body.id as string;
    expect(providerId).toBeDefined();

    const listResponse = await request(app.getHttpServer())
      .get('/admin/providers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listResponse.body.data.some((p: { id: string }) => p.id === providerId)).toBe(true);

    await request(app.getHttpServer())
      .get(`/admin/providers/${providerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('provider flow: me/update and users block/unblock with scoped listing', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@acception.com',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
      })
      .expect(200);
    const adminToken = adminLogin.body.accessToken as string;

    const suffixA = Date.now();
    const providerAAdminEmail = `provider-a-admin-${suffixA}@acception.com`;
    const providerAAdminPassword = 'ProviderA@123';
    const providerA = await request(app.getHttpServer())
      .post('/admin/providers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        legalName: `Provider A ${suffixA} LTDA`,
        tradeName: `Provider A ${suffixA}`,
        cnpj: makeValidCnpj((suffixA + 1) % 9000),
        email: `provider-a-${suffixA}@posto.com`,
        phone: '11999990000',
        responsibleName: 'Responsavel A',
        address: { street: 'Rua A', number: '1', city: 'SP', state: 'SP', zipCode: '01001000' },
        adminUser: {
          email: providerAAdminEmail,
          name: 'Admin A',
          password: providerAAdminPassword,
        },
      })
      .expect(201);
    const providerAId = providerA.body.id as string;

    const suffixB = Date.now() + 1000;
    const providerBAdminEmail = `provider-b-admin-${suffixB}@acception.com`;
    const providerBAdminPassword = 'ProviderB@123';
    await request(app.getHttpServer())
      .post('/admin/providers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        legalName: `Provider B ${suffixB} LTDA`,
        tradeName: `Provider B ${suffixB}`,
        cnpj: makeValidCnpj((suffixB + 2) % 9000),
        email: `provider-b-${suffixB}@posto.com`,
        phone: '11999990000',
        responsibleName: 'Responsavel B',
        address: { street: 'Rua B', number: '2', city: 'SP', state: 'SP', zipCode: '01001000' },
        adminUser: {
          email: providerBAdminEmail,
          name: 'Admin B',
          password: providerBAdminPassword,
        },
      })
      .expect(201);

    const providerALogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: providerAAdminEmail,
        password: providerAAdminPassword,
      })
      .expect(200);
    const providerAToken = providerALogin.body.accessToken as string;

    await request(app.getHttpServer())
      .get('/providers/me')
      .set('Authorization', `Bearer ${providerAToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/providers/me')
      .set('Authorization', `Bearer ${providerAToken}`)
      .send({ tradeName: `Provider A Atualizado ${suffixA}` })
      .expect(200);

    const operatorEmail = `operator-a-${suffixA}@acception.com`;
    const operatorPassword = 'OperatorA@123';
    const createdUser = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${providerAToken}`)
      .send({
        email: operatorEmail,
        name: 'Operador A',
        password: operatorPassword,
        role: 'PROVIDER_OPERATOR',
      })
      .expect(201);
    const operatorId = createdUser.body.id as string;

    const providerBLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: providerBAdminEmail,
        password: providerBAdminPassword,
      })
      .expect(200);
    const providerBToken = providerBLogin.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${providerBToken}`)
      .send({
        email: `operator-b-${suffixB}@acception.com`,
        name: 'Operador B',
        password: 'OperatorB@123',
        role: 'PROVIDER_OPERATOR',
      })
      .expect(201);

    const usersA = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${providerAToken}`)
      .expect(200);
    expect(usersA.body.data.some((u: { email: string }) => u.email === operatorEmail)).toBe(true);
    expect(
      usersA.body.data.some((u: { email: string }) => u.email === `operator-b-${suffixB}@acception.com`),
    ).toBe(false);

    await request(app.getHttpServer())
      .post(`/users/${operatorId}/block`)
      .set('Authorization', `Bearer ${providerAToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: operatorEmail,
        password: operatorPassword,
      })
      .expect(401);

    await request(app.getHttpServer())
      .post(`/users/${operatorId}/unblock`)
      .set('Authorization', `Bearer ${providerAToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: operatorEmail,
        password: operatorPassword,
      })
      .expect(200);

    const auditLogs = await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', `Bearer ${providerAToken}`)
      .expect(200);
    expect(
      auditLogs.body.data.some(
        (log: { action: string; providerId: string | null }) =>
          log.providerId === providerAId && log.action.startsWith('USER_'),
      ),
    ).toBe(true);
  });
});
