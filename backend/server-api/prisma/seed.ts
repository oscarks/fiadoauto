import { randomBytes, pbkdf2Sync } from 'crypto';
import {
  PrismaClient,
  ActorType,
  ProviderStatus,
  UserStatus,
  WhitelabelType,
  SuspensionMode,
  SubscriptionStatus,
  GeneralStatus,
  VehicleType,
  ConveniadoStatus,
  CreditAccountStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const iterations = 120000;
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

async function seedRoles(): Promise<void> {
  const roles = [
    { name: 'ACCEPTION_ADMIN', description: 'Administrador global do SaaS' },
    { name: 'PROVIDER_ADMIN', description: 'Administrador do provider (posto/oficina)' },
    { name: 'PROVIDER_MANAGER', description: 'Gerente do provider (autoriza step-up)' },
    { name: 'PROVIDER_OPERATOR', description: 'Operador/frentista do provider' },
    { name: 'CONVENIADO_ADMIN', description: 'Administrador da empresa conveniada' },
    { name: 'CONVENIADO_USER', description: 'Usuário da empresa conveniada (consulta)' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
}

async function seedSaasPlans(): Promise<void> {
  await prisma.saasPlan.upsert({
    where: { code: 'STARTER' },
    update: {},
    create: {
      name: 'Starter',
      code: 'STARTER',
      baseMonthlyPrice: 199.90,
      maxConvenios: 10,
      maxVehicles: 50,
      maxTransactionsMonth: 1000,
      maxPlansProvider: 5,
      extraTxPrice: 0.50,
      whitelabelType: WhitelabelType.NONE,
      trialDays: 14,
      trialMaxTransactions: 100,
      suspensionMode: SuspensionMode.FULL_BLOCK,
      gracePeriodDays: 5,
    },
  });

  await prisma.saasPlan.upsert({
    where: { code: 'GROWTH' },
    update: {},
    create: {
      name: 'Growth',
      code: 'GROWTH',
      baseMonthlyPrice: 499.90,
      maxConvenios: 50,
      maxVehicles: 300,
      maxTransactionsMonth: 5000,
      maxPlansProvider: 20,
      extraTxPrice: 0.40,
      whitelabelType: WhitelabelType.SUBDOMAIN,
      trialDays: 14,
      trialMaxTransactions: 200,
      suspensionMode: SuspensionMode.BLOCK_AUTH_ONLY,
      gracePeriodDays: 7,
    },
  });

  await prisma.saasPlan.upsert({
    where: { code: 'PRO' },
    update: {},
    create: {
      name: 'Pro',
      code: 'PRO',
      baseMonthlyPrice: 999.90,
      maxConvenios: null,
      maxVehicles: null,
      maxTransactionsMonth: null,
      maxPlansProvider: null,
      extraTxPrice: 0.30,
      whitelabelType: WhitelabelType.CUSTOM_DOMAIN,
      trialDays: 30,
      trialMaxTransactions: null,
      suspensionMode: SuspensionMode.BLOCK_AUTH_ONLY,
      gracePeriodDays: 10,
    },
  });
}

async function seedAcceptionAdmin(): Promise<void> {
  const acceptionProvider = await prisma.provider.upsert({
    where: { cnpj: '00000000000000' },
    update: {},
    create: {
      legalName: 'Acception Tecnologia Ltda',
      tradeName: 'Acception',
      cnpj: '00000000000000',
      email: 'admin@acception.com',
      phone: '0000000000',
      status: ProviderStatus.ACTIVE,
    },
  });

  const role = await prisma.role.findUnique({ where: { name: 'ACCEPTION_ADMIN' } });
  if (!role) throw new Error('Role ACCEPTION_ADMIN not found. Run seedRoles first.');

  const user = await prisma.user.upsert({
    where: { providerId_email: { providerId: acceptionProvider.id, email: 'admin@acception.com' } },
    update: {},
    create: {
      name: 'Acception Admin',
      email: 'admin@acception.com',
      passwordHash: hashPassword('Admin@123'),
      providerId: acceptionProvider.id,
      status: UserStatus.ACTIVE,
      actorType: ActorType.ACCEPTION_ADMIN,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
}

async function seedPostoAndorinha(): Promise<void> {
  // 1. Provider
  const provider = await prisma.provider.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      legalName: 'Posto Andorinha Combustiveis Ltda',
      tradeName: 'Posto Andorinha',
      cnpj: '12345678000190',
      email: 'contato@postoandorinha.com.br',
      phone: '11999990001',
      status: ProviderStatus.ACTIVE,
      timezone: 'America/Sao_Paulo',
      addressJson: {
        street: 'Av. Brasil',
        number: '1500',
        neighborhood: 'Centro',
        city: 'Campinas',
        state: 'SP',
        zipCode: '13010-100',
      },
      geofenceLat: -22.9064,
      geofenceLng: -47.0616,
      geofenceRadiusM: 150,
    },
  });

  // 2. Subscription (Growth plan, ACTIVE)
  const growthPlan = await prisma.saasPlan.findUnique({ where: { code: 'GROWTH' } });
  if (!growthPlan) throw new Error('Plan GROWTH not found.');

  await prisma.subscription.upsert({
    where: { providerId: provider.id },
    update: {},
    create: {
      providerId: provider.id,
      planId: growthPlan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date('2026-04-01'),
      currentPeriodEnd: new Date('2026-04-30'),
    },
  });

  // 3. User admin do provider
  const providerAdminRole = await prisma.role.findUnique({ where: { name: 'PROVIDER_ADMIN' } });
  if (!providerAdminRole) throw new Error('Role PROVIDER_ADMIN not found.');

  const adminUser = await prisma.user.upsert({
    where: { providerId_email: { providerId: provider.id, email: 'admin@postoandorinha.com.br' } },
    update: {},
    create: {
      name: 'Carlos Andorinha',
      email: 'admin@postoandorinha.com.br',
      passwordHash: hashPassword('Admin@123'),
      providerId: provider.id,
      status: UserStatus.ACTIVE,
      actorType: ActorType.PROVIDER_USER,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: providerAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: providerAdminRole.id },
  });

  // 4. Manager PIN (123456)
  await prisma.providerManagerPin.upsert({
    where: { providerId: provider.id },
    update: {},
    create: {
      providerId: provider.id,
      pinHash: hashPassword('123456'),
    },
  });

  // 5. Produtos + precos vigentes
  const products = [
    { code: 'DIESEL_S10', name: 'Diesel S10', price: 6.29 },
    { code: 'DIESEL_COMUM', name: 'Diesel Comum', price: 5.89 },
    { code: 'GASOLINA_COMUM', name: 'Gasolina Comum', price: 5.79 },
    { code: 'GASOLINA_ADITIVADA', name: 'Gasolina Aditivada', price: 6.09 },
    { code: 'ETANOL', name: 'Etanol', price: 3.89 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { providerId_code: { providerId: provider.id, code: p.code } },
      update: {},
      create: {
        providerId: provider.id,
        code: p.code,
        name: p.name,
        unitType: 'LITER',
        status: GeneralStatus.ACTIVE,
      },
    });

    await prisma.priceList.create({
      data: {
        providerId: provider.id,
        productId: product.id,
        pricePerUnit: p.price,
        validFrom: new Date('2026-04-01'),
      },
    });
  }

  // 6. Policy config padrao do provider
  await prisma.policyConfig.create({
    data: {
      providerId: provider.id,
      scopeType: 'PROVIDER',
      policyVersion: '1.0',
      requireDriver: false,
      requireCostCenter: false,
      allowedDaysJson: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      allowedTimeStart: '06:00',
      allowedTimeEnd: '22:00',
      outOfScheduleMode: 'REVIEW',
      geofenceRequiredMode: 'REVIEW',
      vehicleLimitMode: 'DENY',
      periodLimitMode: 'DENY',
      maxTxAmount: 1500.00,
      lockAfterDays: 10,
      minRefuelIntervalMinutes: 60,
      tankOverfillFactor: 1.1,
      odometerRegressionToleranceKm: 5,
      kmPerLThresholdsJson: {
        CAR: { min: 5, max: 18 },
        TRUCK: { min: 2, max: 6 },
        MOTO: { min: 20, max: 45 },
        VAN: { min: 5, max: 14 },
        BUS: { min: 2, max: 5 },
      },
      priceTolerance: 0.05,
      operatorExceptionThreshold: 5,
      operatorWindowHours: 6,
      reversalRateThreshold: 0.1,
      reversalWindowDays: 7,
      reservationTtlSeconds: 600,
    },
  });

  // 7. Plano de convenio
  const convenioPlan = await prisma.convenioplan.create({
    data: {
      providerId: provider.id,
      name: 'Plano Padrao',
      version: 1,
      isActive: true,
      creditLimit: 10000.00,
      vehicleCreditLimit: 3000.00,
      periodLimitsJson: { daily: 2000, weekly: 8000, monthly: 10000 },
      paymentDueDays: 30,
      lateFeePercent: 2,
      lateInterestPercent: 1,
      lockAfterDays: 10,
      requireDriver: false,
      requireCostCenter: false,
      allowedDaysJson: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      allowedTimeStart: '06:00',
      allowedTimeEnd: '22:00',
      minRefuelIntervalMinutes: 60,
      requireOdometer: true,
      maxTxAmount: 1500.00,
      geofenceRequired: false,
      discountPercent: 0,
      adminFeePercent: 0,
    },
  });

  // 8. Conveniado — Transportadora Estrela
  const conveniado = await prisma.conveniado.create({
    data: {
      providerId: provider.id,
      planId: convenioPlan.id,
      legalName: 'Transportadora Estrela Ltda',
      cnpj: '98765432000199',
      email: 'financeiro@estrelatransportes.com.br',
      phone: '11999880001',
      responsibleName: 'Maria Estrela',
      status: ConveniadoStatus.ACTIVE,
      billingCycleDay: 5,
      addressJson: {
        street: 'Rua das Industrias',
        number: '300',
        neighborhood: 'Distrito Industrial',
        city: 'Campinas',
        state: 'SP',
        zipCode: '13054-200',
      },
    },
  });

  // 9. User admin do conveniado
  const conveniadoAdminRole = await prisma.role.findUnique({ where: { name: 'CONVENIADO_ADMIN' } });
  if (!conveniadoAdminRole) throw new Error('Role CONVENIADO_ADMIN not found.');

  const conveniadoUser = await prisma.user.upsert({
    where: { providerId_email: { providerId: provider.id, email: 'maria@estrelatransportes.com.br' } },
    update: {},
    create: {
      name: 'Maria Estrela',
      email: 'maria@estrelatransportes.com.br',
      passwordHash: hashPassword('Admin@123'),
      providerId: provider.id,
      conveniadoId: conveniado.id,
      status: UserStatus.ACTIVE,
      actorType: ActorType.CONVENIADO_USER,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: conveniadoUser.id, roleId: conveniadoAdminRole.id } },
    update: {},
    create: { userId: conveniadoUser.id, roleId: conveniadoAdminRole.id },
  });

  // 10. Credit account
  await prisma.creditAccount.create({
    data: {
      providerId: provider.id,
      conveniadoId: conveniado.id,
      creditLimit: 10000.00,
      currentBalance: 0,
      reservedAmount: 0,
      status: CreditAccountStatus.ACTIVE,
    },
  });

  // 11. Veiculos
  const dieselS10 = await prisma.product.findUnique({
    where: { providerId_code: { providerId: provider.id, code: 'DIESEL_S10' } },
  });
  const dieselComum = await prisma.product.findUnique({
    where: { providerId_code: { providerId: provider.id, code: 'DIESEL_COMUM' } },
  });
  const gasolinaComum = await prisma.product.findUnique({
    where: { providerId_code: { providerId: provider.id, code: 'GASOLINA_COMUM' } },
  });

  const vehicles = [
    { plate: 'ABC1D23', type: VehicleType.TRUCK, tank: 300, limit: 3000.00, products: [dieselS10!, dieselComum!] },
    { plate: 'DEF4G56', type: VehicleType.TRUCK, tank: 300, limit: 3000.00, products: [dieselS10!, dieselComum!] },
    { plate: 'GHI7H89', type: VehicleType.VAN, tank: 80, limit: 1500.00, products: [dieselS10!, dieselComum!] },
    { plate: 'JKL0M12', type: VehicleType.CAR, tank: 55, limit: 800.00, products: [gasolinaComum!] },
    { plate: 'MNO3N45', type: VehicleType.CAR, tank: 50, limit: 800.00, products: [gasolinaComum!] },
  ];

  for (const v of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { providerId_plate: { providerId: provider.id, plate: v.plate } },
      update: {},
      create: {
        providerId: provider.id,
        conveniadoId: conveniado.id,
        plate: v.plate,
        type: v.type,
        tankCapacityLiters: v.tank,
        vehicleCreditLimit: v.limit,
      },
    });

    for (const product of v.products) {
      await prisma.vehicleAllowedProduct.upsert({
        where: { vehicleId_productId: { vehicleId: vehicle.id, productId: product.id } },
        update: {},
        create: { vehicleId: vehicle.id, productId: product.id },
      });
    }
  }

  // 12. Centros de custo
  const costCenters = [
    { code: 'ENTREGA-SP', name: 'Entregas Sao Paulo' },
    { code: 'ENTREGA-RJ', name: 'Entregas Rio de Janeiro' },
    { code: 'ADMIN', name: 'Administrativo' },
  ];

  for (const cc of costCenters) {
    await prisma.costCenter.upsert({
      where: { providerId_conveniadoId_code: { providerId: provider.id, conveniadoId: conveniado.id, code: cc.code } },
      update: {},
      create: {
        providerId: provider.id,
        conveniadoId: conveniado.id,
        code: cc.code,
        name: cc.name,
      },
    });
  }

  // 13. Operador/frentista
  const operatorRole = await prisma.role.findUnique({ where: { name: 'PROVIDER_OPERATOR' } });
  if (!operatorRole) throw new Error('Role PROVIDER_OPERATOR not found.');

  const frentista = await prisma.user.upsert({
    where: { providerId_email: { providerId: provider.id, email: 'joao@postoandorinha.com.br' } },
    update: {},
    create: {
      name: 'Joao Frentista',
      email: 'joao@postoandorinha.com.br',
      passwordHash: hashPassword('Admin@123'),
      providerId: provider.id,
      status: UserStatus.ACTIVE,
      actorType: ActorType.PROVIDER_USER,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: frentista.id, roleId: operatorRole.id } },
    update: {},
    create: { userId: frentista.id, roleId: operatorRole.id },
  });
}

async function main(): Promise<void> {
  console.log('Seeding roles...');
  await seedRoles();

  console.log('Seeding SaaS plans...');
  await seedSaasPlans();

  console.log('Seeding Acception admin...');
  await seedAcceptionAdmin();

  console.log('Seeding Posto Andorinha...');
  await seedPostoAndorinha();

  console.log('Seed completed.');
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
