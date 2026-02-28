# Fase 1 — Especificação Consolidada de Implementação

**Versão:** 1.0
**Data:** 2026-02-27
**Status:** Proposta para aprovação

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Decisões Técnicas Consolidadas](#2-decisões-técnicas-consolidadas)
3. [Sub-fases de Entrega](#3-sub-fases-de-entrega)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [F1.A — Fundacional](#5-f1a--fundacional-core--auth--tenancy)
6. [F1.B — SaaS Platform](#6-f1b--saas-platform-registro--billing)
7. [F1.C — Crédito Core](#7-f1c--crédito-core-convênios--ledger--billing-provider)
8. [F1.D — Autorização + App Frentista](#8-f1d--autorização--antifraude--app-frentista)
9. [F1.E — White-label + Portais](#9-f1e--white-label--portais-completos)
10. [Catálogo de Regras Antifraude](#10-catálogo-de-regras-antifraude-determinístico)
11. [Catálogo de Notificações](#11-catálogo-de-notificações)
12. [Fora do Escopo](#12-fora-do-escopo-fase-1)
13. [Riscos e Mitigações](#13-riscos-e-mitigações)
14. [Registro de Decisões de Escopo e Evolução](#14-registro-de-decisões-de-escopo-e-evolução)

---

## 1. Visão Geral

### 1.1 Objetivo

Entregar a plataforma funcional para **postos de combustível** operarem convênios de crédito (fiado) com empresas, incluindo:

- Registro e gestão de providers (postos) com modelo SaaS
- Gestão de convênios, frota e crédito com ledger auditável
- Autorização de abastecimento com antifraude determinístico
- App mobile para frentistas (autorização em campo)
- Billing SaaS (Acception cobra provider) com gateway Asaas
- Billing Provider (provider cobra conveniado) com cobrança manual
- White-label (subdomínio a partir de Growth, domínio próprio no Pro)

### 1.2 Épicos da Fase 1

| Épico | Nome | Sub-fase |
|-------|------|----------|
| F1.1 | Multitenancy & Identidade | F1.A |
| F1.2 | Registro e Onboarding Provider | F1.B |
| F1.3 | Planos SaaS e Billing | F1.B |
| F1.4 | Gestão de Convênios | F1.C |
| F1.5 | Crédito & Ledger | F1.C |
| F1.6 | Autorização + Antifraude Determinístico | F1.D |
| F1.7 | App Frentista | F1.D |
| F1.8 | Contas a Receber do Provider | F1.C |
| F1.9 | White-label | F1.E |

### 1.3 Aplicações envolvidas

| Aplicação | Tecnologia | Porta | Sub-fase |
|-----------|-----------|-------|----------|
| server-api | NestJS 11 + Prisma 7 | 5100 | F1.A+ |
| portal-acception | Vue 3 + Vuetify 4 | 5000 | F1.E |
| portal-solution | Vue 3 + Vuetify 4 | 5001 | F1.B |
| portal-provider | Vue 3 + Vuetify 4 | 5002 | F1.E |
| portal-conveniado | Vue 3 + Vuetify 4 | 5003 | F1.E |
| app-frentista | Flutter | — | F1.D |

---

## 2. Decisões Técnicas Consolidadas

| # | Decisão | Escolha | Referência |
|---|---------|---------|------------|
| 1 | Multitenancy | Shared DB + `provider_id` em todas as tabelas | ADR-001 |
| 2 | Empresa conveniada | Escopo (`conveniado_id`), não sub-tenant | ADR-002/003 |
| 3 | Backend | Monólito modular NestJS + Clean Architecture | ADR-004 |
| 4 | Ledger | Append-only, saldos materializados síncronos | ADR-005 |
| 5 | Antifraude F1 | Policy Engine determinístico no backend | ADR-006 |
| 6 | IA | Separada em Python; **não implementada** na F1 | ADR-007 |
| 7 | App Frentista | Online obrigatório; offline apenas pré-captura | ADR-008 |
| 8 | White-label | Growth+ (subdomínio), Pro+ (domínio próprio) | ADR-009 |
| 9 | Billing | SaaS e Provider separados, mesma estrutura base | ADR-010 |
| 10 | Trial/Suspensão | Configuráveis por plano SaaS | ADR-011 |
| 11 | Gateway pagamento SaaS | **Asaas** | Decisão F1 |
| 12 | Cadastro conveniado | **Apenas provider-initiated** (F1) | Decisão F1 |
| 13 | Identificação veículo | **QR Code apenas** (F1) | Decisão F1 |
| 14 | Roles conveniado | **Papel único** `CONVENIADO_ADMIN` (F1) | Decisão F1 |
| 15 | Materialização saldos | **Síncrono no write** (mesma transação DB) | Decisão F1 |
| 16 | Email transacional | **Adapter abstrato** (provedor real definido depois) | Decisão F1 |
| 17 | Entrega | **Sub-fases incrementais** (F1.A a F1.E) | Decisão F1 |
| 18 | Autenticação | JWT access token (15min) + refresh token (7 dias) | Padrão |
| 19 | Hash de senha | bcrypt, cost factor 12 | Padrão |
| 20 | Unicidade email | **Global** (F1); por-tenant (futuro) | Decisão F1 |
| 21 | Reserva de crédito TTL | **15 minutos** (configurável) | Decisão F1 |
| 22 | Gateway pagamento Provider | **Não implementado** F1 (cobrança manual apenas) | Decisão F1 |

---

## 3. Sub-fases de Entrega

### F1.A — Fundacional (Core + Auth + Tenancy)

**Escopo:** Infraestrutura core necessária antes de qualquer lógica de negócio.
**Épicos:** F1.1 (parcial)
**Pré-requisito:** Nenhum
**Entregável:** API core funcional com auth, multitenancy, RBAC e audit.

Módulos: `auth`, `tenancy`, `rbac`, `audit`, `i18n`, `providers` (CRUD básico)

### F1.B — SaaS Platform (Registro + Billing)

**Escopo:** Provider pode se registrar, iniciar trial, fazer onboarding e pagar assinatura.
**Épicos:** F1.2, F1.3
**Pré-requisito:** F1.A
**Entregável:** Portal Solution API funcional, registro end-to-end, billing SaaS com Asaas.

Módulos: `portal-solution`, `billing-saas`, `admin-acception` (básico), `payment-gateway` (Asaas), `notifications` (adapter)

### F1.C — Crédito Core (Convênios + Ledger + Billing Provider)

**Escopo:** Provider pode criar planos, cadastrar conveniados, gerenciar crédito e gerar faturas.
**Épicos:** F1.4, F1.5, F1.8
**Pré-requisito:** F1.B
**Entregável:** Fluxo completo de convênio → crédito → fatura → pagamento manual.

Módulos: `plans-provider`, `conveniados`, `fleet`, `credit`, `ledger`, `billing-provider`

### F1.D — Autorização + Antifraude + App Frentista

**Escopo:** Fluxo de autorização de abastecimento completo com antifraude e app mobile.
**Épicos:** F1.6, F1.7
**Pré-requisito:** F1.C
**Entregável:** App Frentista funcional com autorização em tempo real.

Módulos: `catalog`, `policy-engine`, `refuel`, `evidence`, `storage`

### F1.E — White-label + Portais Completos

**Escopo:** Portais web completos e white-label funcional.
**Épicos:** F1.9, portais
**Pré-requisito:** F1.D
**Entregável:** 4 portais Vue funcionais, white-label com subdomínio/domínio próprio.

Módulos: `observability`, portais Vue (portal-provider, portal-conveniado, portal-acception, portal-solution)

### Diagrama de Dependência

```mermaid
graph LR
    A[F1.A Fundacional] --> B[F1.B SaaS Platform]
    B --> C[F1.C Crédito Core]
    C --> D[F1.D Autorização + App]
    D --> E[F1.E White-label + Portais]
```

---

## 4. Modelo de Dados

### 4.1 Enums

```prisma
enum ProviderStatus {
  PENDING_VERIFICATION  // aguardando confirmação de email
  TRIAL_ACTIVE          // trial ativo
  ACTIVE                // assinatura ativa
  PAST_DUE              // pagamento em atraso
  SUSPENDED             // suspenso por inadimplência SaaS
  CANCELED              // cancelado definitivamente
}

enum UserRole {
  ACCEPTION_ADMIN       // admin da plataforma
  PROVIDER_ADMIN        // admin do posto
  PROVIDER_OPERATOR     // operador (frentista com acesso ao portal)
  PROVIDER_MANAGER      // gerente (pode aprovar step-up)
  CONVENIADO_ADMIN      // admin da empresa conveniada
}

enum UserStatus {
  PENDING_VERIFICATION  // aguardando confirmação de email
  ACTIVE                // ativo
  BLOCKED               // bloqueado manualmente
}

enum ConveniadoStatus {
  PENDING_ACTIVATION    // aguardando ativação via link
  ACTIVE                // ativo e operando
  BLOCKED               // bloqueio manual pelo provider
  DELINQUENT            // inadimplência detectada (automático)
  LOCKED                // lock severo por inadimplência > X dias (automático)
  CLOSED                // encerrado definitivamente
}

enum VehicleStatus {
  ACTIVE
  INACTIVE
}

enum LedgerEntryType {
  RESERVE               // pré-bloqueio de crédito
  RESERVE_RELEASE       // liberação de reserva (expiração/cancelamento)
  DEBIT                 // débito efetivo (abastecimento confirmado)
  CREDIT                // pagamento recebido / crédito adicionado
  REVERSAL              // estorno de débito
  ADJUSTMENT            // ajuste manual (com auditoria obrigatória)
  FEE                   // juros ou multa
}

enum RefuelStatus {
  PENDING_AUTH          // aguardando decisão do policy engine
  DENIED                // negado
  REVIEW                // aguardando step-up
  AUTHORIZED            // aprovado, reserva criada
  POSTED                // débito efetivado no ledger
  REVERSED              // estornado
  EXPIRED               // reserva expirada (TTL)
}

enum AuthDecision {
  ALLOW
  DENY
  REVIEW
}

enum StepUpAction {
  PIN_MANAGER           // PIN do gerente
  PHOTO_ODOMETER        // foto do hodômetro
  PHOTO_RECEIPT         // foto do recibo
}

enum ProviderInvoiceStatus {
  DRAFT                 // rascunho (em geração)
  OPEN                  // emitida, aguardando envio
  SENT                  // enviada ao conveniado
  PAID                  // paga integralmente
  PARTIAL_PAID          // pagamento parcial registrado
  PAST_DUE              // vencida
  LOCKED                // bloqueada (conveniado locked)
  CANCELED              // cancelada
}

enum SaasSubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELED
}

enum SaasInvoiceStatus {
  PENDING
  PAID
  PAST_DUE
  CANCELED
}

enum SuspensionMode {
  FULL_BLOCK            // bloqueia todas as operações
  BLOCK_AUTH_ONLY       // impede apenas novas autorizações de abastecimento
}

enum WhitelabelType {
  NONE                  // Starter: usa domínio padrão da solução
  SUBDOMAIN             // Growth: subdomínio (posto.acpt.app)
  CUSTOM_DOMAIN         // Pro: domínio próprio (fiado.postoxyz.com.br)
}

enum NotificationChannel {
  EMAIL
  SYSTEM                // in-app notification
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}
```

### 4.2 Core

```prisma
model Provider {
  id              String          @id @default(uuid())
  legalName       String          // Razão social
  tradeName       String          // Nome fantasia
  cnpj            String          @unique
  email           String
  phone           String?
  responsibleName String
  address         Json            // { street, number, complement, neighborhood, city, state, zipCode }
  status          ProviderStatus  @default(PENDING_VERIFICATION)
  onboardingState Json?           // checklist: ver seção 6.3
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  users           User[]
  conveniados     Conveniado[]
  providerPlans   ProviderPlan[]
  products        Product[]
  priceLists      PriceList[]
  domains         ProviderDomain[]
  branding        ProviderBranding?
  subscription    SaasSubscription?
  creditAccounts  CreditAccount[]
  vehicles        Vehicle[]
  auditLogs       AuditLog[]
  contractTemplates ContractTemplate[]
}

model User {
  id              String      @id @default(uuid())
  providerId      String?     // null apenas para ACCEPTION_ADMIN
  conveniadoId    String?     // null para provider users e acception admins
  email           String      @unique  // globalmente único na F1
  passwordHash    String
  name            String
  role            UserRole
  status          UserStatus  @default(PENDING_VERIFICATION)
  emailVerifiedAt DateTime?
  lastLoginAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  provider        Provider?   @relation(fields: [providerId], references: [id])
  conveniado      Conveniado? @relation(fields: [conveniadoId], references: [id])
  refreshTokens   RefreshToken[]

  @@index([providerId])
  @@index([providerId, conveniadoId])
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model EmailVerificationToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([token])
}

model AuditLog {
  id          String   @id @default(uuid())
  providerId  String?
  userId      String?
  action      String   // ex: USER_CREATED, REFUEL_AUTHORIZED, MANUAL_ADJUSTMENT
  entity      String   // ex: User, RefuelTransaction, CreditAccount
  entityId    String?
  oldValue    Json?    // estado anterior (para mutations)
  newValue    Json?    // estado novo
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  provider    Provider? @relation(fields: [providerId], references: [id])

  @@index([providerId, createdAt])
  @@index([entity, entityId])
  @@index([action, createdAt])
}
```

### 4.3 SaaS

```prisma
model SaasPlan {
  id                        String          @id @default(uuid())
  name                      String          @unique  // Starter, Growth, Pro
  displayName               String
  monthlyPrice              Decimal         @db.Decimal(10, 2)
  maxConveniados            Int
  maxVehicles               Int
  maxTransactionsIncluded   Int
  extraTransactionPrice     Decimal         @db.Decimal(10, 2)
  maxProviderPlans          Int             // max planos que o provider pode criar
  whitelabelType            WhitelabelType
  trialDays                 Int             @default(14)
  trialMaxConveniados       Int?            // limite de conveniados durante trial
  suspensionMode            SuspensionMode  @default(FULL_BLOCK)
  gracePeriodDays           Int             @default(5)
  features                  Json?           // feature flags adicionais
  active                    Boolean         @default(true)
  sortOrder                 Int             @default(0)
  createdAt                 DateTime        @default(now())
  updatedAt                 DateTime        @updatedAt

  subscriptions             SaasSubscription[]
}

model SaasSubscription {
  id                      String                  @id @default(uuid())
  providerId              String                  @unique
  planId                  String
  status                  SaasSubscriptionStatus  @default(TRIAL)
  trialEndsAt             DateTime?
  currentPeriodStart      DateTime?
  currentPeriodEnd        DateTime?
  gatewayCustomerId       String?                 // Asaas customer ID
  gatewaySubscriptionId   String?                 // Asaas subscription ID
  suspendedAt             DateTime?
  canceledAt              DateTime?
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt

  provider                Provider                @relation(fields: [providerId], references: [id])
  plan                    SaasPlan                @relation(fields: [planId], references: [id])
  invoices                SaasInvoice[]
}

model SaasInvoice {
  id                String            @id @default(uuid())
  subscriptionId    String
  providerId        String
  amount            Decimal           @db.Decimal(10, 2)  // valor base
  extraAmount       Decimal           @db.Decimal(10, 2)  @default(0)  // variável por uso
  totalAmount       Decimal           @db.Decimal(10, 2)
  dueDate           DateTime
  paidAt            DateTime?
  status            SaasInvoiceStatus @default(PENDING)
  gatewayChargeId   String?           // Asaas charge ID
  gatewayPaymentUrl String?           // URL para pagamento (boleto/pix)
  periodStart       DateTime
  periodEnd         DateTime
  details           Json?             // breakdown de uso
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  subscription      SaasSubscription  @relation(fields: [subscriptionId], references: [id])

  @@index([providerId, status])
  @@index([dueDate, status])
}

model SaasPaymentEvent {
  id              String   @id @default(uuid())
  invoiceId       String
  gatewayEventId  String   @unique  // idempotência de webhooks
  eventType       String             // PAYMENT_CONFIRMED, PAYMENT_FAILED, PAYMENT_OVERDUE
  payload         Json
  processedAt     DateTime @default(now())

  @@index([invoiceId])
}
```

### 4.4 Domínio Provider

```prisma
model ProviderPlan {
  id                      String   @id @default(uuid())
  providerId              String
  name                    String
  description             String?
  version                 Int      @default(1)
  active                  Boolean  @default(true)

  // --- Crédito ---
  globalLimit             Decimal  @db.Decimal(12, 2)   // limite global do convênio
  vehicleLimit            Decimal? @db.Decimal(12, 2)   // limite default por veículo
  dailyLimit              Decimal? @db.Decimal(12, 2)   // limite diário
  weeklyLimit             Decimal? @db.Decimal(12, 2)   // limite semanal
  monthlyLimit            Decimal? @db.Decimal(12, 2)   // limite mensal
  paymentTermDays         Int      @default(30)          // prazo de pagamento (dias)
  lateFeePercent          Decimal  @db.Decimal(5, 2)    @default(0)  // juros atraso (% ao mês)
  penaltyPercent          Decimal  @db.Decimal(5, 2)    @default(0)  // multa (%)
  autoLockDays            Int      @default(30)          // lock automático após X dias

  // --- Governança ---
  requireDriver           Boolean  @default(false)       // exigir motorista (futuro)
  requireCostCenter       Boolean  @default(false)       // exigir centro de custo
  allowedHoursStart       String?                        // "06:00" ou null (sem restrição)
  allowedHoursEnd         String?                        // "22:00" ou null (sem restrição)
  allowedProductIds       String[]                       // IDs de produtos, vazio = todos
  minRefuelIntervalMin    Int?                           // min minutos entre abastecimentos
  maxTransactionAmount    Decimal? @db.Decimal(12, 2)   // valor máximo por transação

  // --- Antifraude ---
  requireOdometer         Boolean  @default(true)
  photoThresholdAmount    Decimal? @db.Decimal(12, 2)   // exigir foto acima deste valor
  pinThresholdAmount      Decimal? @db.Decimal(12, 2)   // exigir PIN acima deste valor
  requireGeofence         Boolean  @default(false)

  // --- Comercial ---
  discountPerLiter        Decimal? @db.Decimal(5, 2)    // desconto por litro
  adminFeePercent         Decimal? @db.Decimal(5, 2)    // taxa administrativa

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  provider                Provider @relation(fields: [providerId], references: [id])
  conveniados             Conveniado[]

  @@index([providerId, active])
  @@unique([providerId, name, version])
}

model Conveniado {
  id                        String           @id @default(uuid())
  providerId                String
  planId                    String
  legalName                 String           // Razão social
  tradeName                 String?          // Nome fantasia
  cnpj                      String
  email                     String
  phone                     String?
  responsibleName           String
  address                   Json?
  status                    ConveniadoStatus @default(PENDING_ACTIVATION)
  activationToken           String?          @unique
  activationTokenExpiresAt  DateTime?
  activatedAt               DateTime?
  blockedAt                 DateTime?
  blockedReason             String?
  contractTemplateId        String?          // versão do contrato aceito
  contractAcceptedAt        DateTime?
  contractIp                String?
  onboardingState           Json?
  createdAt                 DateTime         @default(now())
  updatedAt                 DateTime         @updatedAt

  provider                  Provider         @relation(fields: [providerId], references: [id])
  plan                      ProviderPlan     @relation(fields: [planId], references: [id])
  users                     User[]
  vehicles                  Vehicle[]
  costCenters               CostCenter[]
  creditAccount             CreditAccount?
  invoices                  ProviderInvoice[]
  refuelTransactions        RefuelTransaction[]

  @@unique([providerId, cnpj])
  @@index([providerId, status])
}

model ContractTemplate {
  id          String   @id @default(uuid())
  providerId  String
  name        String   @default("Contrato Padrão de Convênio")
  content     String   // HTML template com {{variáveis}}
  version     Int      @default(1)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  provider    Provider @relation(fields: [providerId], references: [id])

  @@index([providerId, active])
}

model Vehicle {
  id              String        @id @default(uuid())
  providerId      String
  conveniadoId    String
  plate           String
  description     String?       // "Fiat Strada Branca"
  qrCode          String        @unique  // UUID gerado para QR Code
  vehicleLimit    Decimal?      @db.Decimal(12, 2)  // override do limite do plano
  status          VehicleStatus @default(ACTIVE)
  lastOdometer    Int?          // atualizado a cada abastecimento
  lastRefuelAt    DateTime?     // atualizado a cada abastecimento
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  provider        Provider      @relation(fields: [providerId], references: [id])
  conveniado      Conveniado    @relation(fields: [conveniadoId], references: [id])
  refuelTransactions RefuelTransaction[]

  @@unique([providerId, plate])
  @@index([providerId, conveniadoId])
  @@index([qrCode])
}

model CostCenter {
  id              String   @id @default(uuid())
  providerId      String
  conveniadoId    String
  name            String
  code            String?
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  conveniado      Conveniado @relation(fields: [conveniadoId], references: [id])

  @@unique([providerId, conveniadoId, name])
  @@index([providerId, conveniadoId])
}
```

### 4.5 Crédito & Ledger

```prisma
model CreditAccount {
  id                      String   @id @default(uuid())
  providerId              String
  conveniadoId            String   @unique
  globalLimit             Decimal  @db.Decimal(12, 2)  // copiado do plano, pode ser override
  currentBalance          Decimal  @db.Decimal(12, 2)  @default(0)
  // Convenção: balance negativo = dívida do conveniado
  // balance 0 = sem dívida
  // balance positivo = crédito a favor (pagou mais)
  reservedAmount          Decimal  @db.Decimal(12, 2)  @default(0)  // reservas pendentes
  availableCredit         Decimal  @db.Decimal(12, 2)  @default(0)
  // availableCredit = globalLimit - abs(min(currentBalance, 0)) - reservedAmount
  lockedAt                DateTime?
  lastReconciliationAt    DateTime?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  provider                Provider    @relation(fields: [providerId], references: [id])
  conveniado              Conveniado  @relation(fields: [conveniadoId], references: [id])
  entries                 LedgerEntry[]

  @@index([providerId])
}

model LedgerEntry {
  id              String          @id @default(uuid())
  creditAccountId String
  providerId      String
  conveniadoId    String
  type            LedgerEntryType
  amount          Decimal         @db.Decimal(12, 2)  // sempre positivo
  balanceAfter    Decimal         @db.Decimal(12, 2)  // snapshot do saldo após esta entrada
  description     String?
  referenceType   String?         // "RefuelTransaction", "ProviderInvoice", "Manual"
  referenceId     String?         // ID da entidade referenciada
  externalTxId    String?         // para idempotência (abastecimentos)
  metadata        Json?
  createdBy       String?         // userId que criou (para adjustments)
  createdAt       DateTime        @default(now())

  // IMUTÁVEL: sem updatedAt, sem soft-delete

  creditAccount   CreditAccount   @relation(fields: [creditAccountId], references: [id])

  @@unique([providerId, externalTxId])  // idempotência
  @@index([creditAccountId, createdAt])
  @@index([providerId, conveniadoId, createdAt])
  @@index([referenceType, referenceId])
}
```

### 4.6 Autorização & Refuel

```prisma
model Product {
  id          String   @id @default(uuid())
  providerId  String
  name        String   // "Gasolina Comum", "Diesel S10", "Etanol"
  unit        String   // "L" (litro)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  provider    Provider @relation(fields: [providerId], references: [id])
  priceItems  PriceListItem[]

  @@unique([providerId, name])
  @@index([providerId, active])
}

model PriceList {
  id          String   @id @default(uuid())
  providerId  String
  effectiveAt DateTime // data/hora de início de vigência
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  provider    Provider @relation(fields: [providerId], references: [id])
  items       PriceListItem[]

  @@index([providerId, effectiveAt])
}

model PriceListItem {
  id          String  @id @default(uuid())
  priceListId String
  productId   String
  unitPrice   Decimal @db.Decimal(10, 4)

  priceList   PriceList @relation(fields: [priceListId], references: [id])
  product     Product   @relation(fields: [productId], references: [id])

  @@unique([priceListId, productId])
}

model RefuelTransaction {
  id              String       @id @default(uuid())
  providerId      String
  conveniadoId    String
  vehicleId       String
  externalTxId    String       // UUID gerado pelo app (idempotência)
  status          RefuelStatus @default(PENDING_AUTH)

  // --- Dados do request ---
  productId       String?
  liters          Decimal?     @db.Decimal(10, 3)
  unitPrice       Decimal?     @db.Decimal(10, 4)
  totalAmount     Decimal      @db.Decimal(12, 2)
  odometer        Int?
  operatorId      String?      // user ID do frentista
  costCenterId    String?
  latitude        Decimal?     @db.Decimal(10, 7)
  longitude       Decimal?     @db.Decimal(10, 7)

  // --- Decisão do Policy Engine ---
  decision        AuthDecision?
  reasonCodes     String[]     // ex: ["AF-007", "AF-013"]
  requiredActions StepUpAction[]
  policyVersion   String?
  decisionDetails Json?        // rule hits completo

  // --- Step-up ---
  stepUpCompleted Boolean      @default(false)
  pinVerifiedAt   DateTime?
  pinVerifiedBy   String?      // user ID do gerente

  // --- Settlement ---
  reserveEntryId  String?      // ID do LedgerEntry de reserva
  debitEntryId    String?      // ID do LedgerEntry de débito
  reservedAt      DateTime?
  postedAt        DateTime?
  reversedAt      DateTime?
  expiresAt       DateTime?    // TTL da reserva (default 15min)

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  provider        Provider     @relation(fields: [providerId], references: [id])
  conveniado      Conveniado   @relation(fields: [conveniadoId], references: [id])
  vehicle         Vehicle      @relation(fields: [vehicleId], references: [id])
  evidences       Evidence[]

  @@unique([providerId, externalTxId])
  @@index([providerId, conveniadoId, createdAt])
  @@index([vehicleId, createdAt])
  @@index([status])
}

model Evidence {
  id              String   @id @default(uuid())
  providerId      String
  refuelId        String
  type            String   // "PHOTO_ODOMETER", "PHOTO_RECEIPT", "GEO"
  storageKey      String   // S3/MinIO object key
  contentHash     String   // SHA-256 do arquivo
  mimeType        String?
  metadata        Json?    // { latitude, longitude, capturedAt, deviceInfo }
  createdAt       DateTime @default(now())

  refuel          RefuelTransaction @relation(fields: [refuelId], references: [id])

  @@index([providerId, refuelId])
}
```

### 4.7 Billing Provider

```prisma
model ProviderInvoice {
  id              String                @id @default(uuid())
  providerId      String
  conveniadoId    String
  invoiceNumber   String                // gerado: "INV-{YYYYMM}-{SEQ}"
  status          ProviderInvoiceStatus @default(DRAFT)
  periodStart     DateTime
  periodEnd       DateTime
  subtotal        Decimal               @db.Decimal(12, 2)
  fees            Decimal               @db.Decimal(12, 2) @default(0) // juros + multa
  totalAmount     Decimal               @db.Decimal(12, 2)
  dueDate         DateTime
  paidAmount      Decimal               @db.Decimal(12, 2) @default(0)
  paidAt          DateTime?
  sentAt          DateTime?
  lockedAt        DateTime?
  notes           String?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  conveniado      Conveniado            @relation(fields: [conveniadoId], references: [id])
  items           ProviderInvoiceItem[]
  payments        ProviderPayment[]

  @@unique([providerId, invoiceNumber])
  @@index([providerId, conveniadoId, status])
  @@index([dueDate, status])
}

model ProviderInvoiceItem {
  id              String  @id @default(uuid())
  invoiceId       String
  description     String  // "Gasolina Comum - 45.3L x R$5.89"
  quantity        Decimal @db.Decimal(10, 3)
  unitPrice       Decimal @db.Decimal(10, 4)
  amount          Decimal @db.Decimal(12, 2)
  refuelId        String? // vínculo com a transação original
  ledgerEntryId   String?

  invoice         ProviderInvoice @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
}

model ProviderPayment {
  id              String   @id @default(uuid())
  invoiceId       String
  amount          Decimal  @db.Decimal(12, 2)
  method          String   // "MANUAL", "PIX", "BOLETO", "TRANSFER", "CASH"
  reference       String?  // nº comprovante
  notes           String?
  registeredBy    String   // user ID de quem registrou
  paidAt          DateTime
  createdAt       DateTime @default(now())

  invoice         ProviderInvoice @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
}
```

### 4.8 White-label & Branding

```prisma
model ProviderDomain {
  id          String         @id @default(uuid())
  providerId  String
  domain      String         @unique  // ex: "postoxyz.acpt.app" ou "fiado.postoxyz.com.br"
  type        WhitelabelType
  verified    Boolean        @default(false)
  verifiedAt  DateTime?
  sslStatus   String?        // PENDING, ACTIVE, ERROR
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([providerId])
  @@index([domain])
}

model ProviderBranding {
  id              String  @id @default(uuid())
  providerId      String  @unique
  logoUrl         String?
  faviconUrl      String?
  primaryColor    String  @default("#1976D2")
  secondaryColor  String  @default("#424242")
  accentColor     String?
  customCss       String?

  provider        Provider @relation(fields: [providerId], references: [id])
}
```

### 4.9 Notificações

```prisma
model NotificationTemplate {
  id          String              @id @default(uuid())
  code        String              // "PROVIDER_WELCOME", "INVOICE_GENERATED"
  channel     NotificationChannel
  subject     String              // template com {{variáveis}}
  body        String              // template com {{variáveis}}
  locale      String              @default("pt-BR")
  active      Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@unique([code, locale, channel])
}

model NotificationLog {
  id              String             @id @default(uuid())
  providerId      String?
  templateCode    String
  channel         NotificationChannel
  recipient       String             // email address
  subject         String
  status          NotificationStatus @default(PENDING)
  sentAt          DateTime?
  errorMessage    String?
  metadata        Json?
  createdAt       DateTime           @default(now())

  @@index([providerId, createdAt])
  @@index([status])
}
```

---

## 5. F1.A — Fundacional (Core + Auth + Tenancy)

### 5.1 Módulo Auth

#### Fluxo de Autenticação

```mermaid
sequenceDiagram
  participant C as Client
  participant A as Auth API
  participant DB as PostgreSQL

  C->>A: POST /auth/login {email, password}
  A->>DB: buscar User por email
  A->>A: verificar bcrypt(password, hash)
  A->>DB: criar RefreshToken
  A-->>C: { accessToken, refreshToken, expiresIn }

  Note over C,A: Access Token expira em 15 min

  C->>A: POST /auth/refresh {refreshToken}
  A->>DB: validar RefreshToken (não expirado, não revogado)
  A->>DB: revogar token antigo, criar novo
  A-->>C: { accessToken, refreshToken, expiresIn }

  C->>A: POST /auth/logout {refreshToken}
  A->>DB: revogar RefreshToken
  A-->>C: 204 No Content
```

#### JWT Payload (Access Token)

```json
{
  "sub": "user-uuid",
  "email": "user@email.com",
  "role": "PROVIDER_ADMIN",
  "providerId": "provider-uuid",
  "conveniadoId": null,
  "iat": 1709000000,
  "exp": 1709000900
}
```

- **Access token:** 15 minutos, assinado com HS256 (secret em env `JWT_SECRET`)
- **Refresh token:** 7 dias, UUID armazenado em DB, rotação obrigatória (single-use)
- **Password:** bcrypt, cost factor 12

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register` | Registro de provider (delega para portal-solution) | Público |
| POST | `/auth/login` | Login | Público |
| POST | `/auth/refresh` | Renovar tokens | Público (refresh token) |
| POST | `/auth/logout` | Revogar refresh token | Autenticado |
| POST | `/auth/verify-email` | Verificar email com token | Público |
| POST | `/auth/forgot-password` | Solicitar reset de senha | Público |
| POST | `/auth/reset-password` | Resetar senha com token | Público |
| GET | `/auth/me` | Dados do usuário logado + tenant context | Autenticado |

#### Regras

- `POST /auth/login` com credenciais inválidas: retorna 401 genérico (sem indicar se email existe)
- Após 5 tentativas falhas em 15 min para o mesmo email: bloquear temporariamente por 15 min
- Token de verificação de email: expira em 24h, uso único
- Token de reset de senha: expira em 1h, uso único

### 5.2 Módulo Tenancy

#### TenantContext

Objeto injetado em toda requisição autenticada via `TenantGuard`:

```typescript
interface TenantContext {
  providerId: string;       // sempre presente (exceto ACCEPTION_ADMIN)
  conveniadoId?: string;    // presente apenas para CONVENIADO_ADMIN
  userId: string;
  role: UserRole;
  actorType: 'PROVIDER' | 'CONVENIADO' | 'ACCEPTION';
}
```

#### Resolução do Provider

1. **Token JWT:** `providerId` extraído do claim (padrão para todas as requisições autenticadas)
2. **Header `X-Provider-Domain`:** fallback para resolução por domínio (portais white-label)
3. **Acception admin:** sem `providerId` fixo; pode atuar em qualquer provider via `?providerId=xxx` (auditado)

#### Regras de Scoping

- **Repositórios**: todo método de leitura/escrita exige `providerId` como parâmetro obrigatório. Se não fornecido, lança exceção `TenancyScopeError` (fail-fast)
- **Conveniado user**: além de `providerId`, todas as queries são filtradas por `conveniadoId`
- **Provider user**: vê todos os dados do provider (todas as empresas)
- **Acception admin**: acessa qualquer provider, mas cada acesso é registrado em audit log

### 5.3 Módulo RBAC

#### Roles e Permissões (Fase 1)

| Role | Escopo | Permissões |
|------|--------|------------|
| ACCEPTION_ADMIN | Plataforma | Gerenciar tenants, planos SaaS, billing, impersonate |
| PROVIDER_ADMIN | Provider | Tudo no provider: convênios, crédito, usuários, config |
| PROVIDER_MANAGER | Provider | Operacional + aprovar step-up (PIN) |
| PROVIDER_OPERATOR | Provider | Operacional: visualizar, registrar pagamentos |
| CONVENIADO_ADMIN | Conveniado | Gestão da empresa: frota, extratos, faturas |

#### Implementação

- Guard global `RolesGuard` que verifica `@Roles(...)` decorator nos controllers
- Permissões fixas por role na Fase 1 (sem tabela de permissões configuráveis)
- Evolução para permissões granulares em fases futuras

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/users` | Listar usuários do provider | PROVIDER_ADMIN |
| POST | `/users` | Criar usuário | PROVIDER_ADMIN |
| PATCH | `/users/:id` | Atualizar usuário | PROVIDER_ADMIN |
| DELETE | `/users/:id` | Desativar usuário | PROVIDER_ADMIN |
| POST | `/users/:id/block` | Bloquear usuário | PROVIDER_ADMIN |
| POST | `/users/:id/unblock` | Desbloquear usuário | PROVIDER_ADMIN |

### 5.4 Módulo Audit

#### Regras

- Toda operação de escrita (create/update/delete) em entidades de negócio gera registro em `AuditLog`
- `AuditLog` é **append-only**: sem update, sem delete
- Campos `oldValue` e `newValue` registram o diff da operação
- Retenção: ilimitada na F1 (política de retenção em fase futura)

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/audit-logs` | Listar logs (filtros: entity, action, dateRange) | PROVIDER_ADMIN, ACCEPTION_ADMIN |
| GET | `/audit-logs/:id` | Detalhe de um log | PROVIDER_ADMIN, ACCEPTION_ADMIN |

### 5.5 Módulo i18n

- Locale padrão: `pt-BR`
- Locales suportados na F1: `pt-BR` (outros preparados na estrutura)
- Implementação via `nestjs-i18n` ou similar
- Mensagens de erro, validação e notificação internacionalizáveis
- Templates de notificação com locale

### 5.6 Critérios de Aceite — F1.A

- [ ] Provider admin consegue fazer login e receber JWT válido
- [ ] Refresh token funciona e rotaciona corretamente
- [ ] Tentativa de acesso sem token retorna 401
- [ ] Tentativa de acesso a dados de outro provider retorna 403
- [ ] Toda operação de escrita gera audit log
- [ ] Repositórios rejeitam queries sem `providerId` (teste unitário)
- [ ] Rate limiting de login funciona (5 tentativas / 15 min)

---

## 6. F1.B — SaaS Platform (Registro + Billing)

### 6.1 Planos SaaS (Seed Data)

| Campo | Starter | Growth | Pro |
|-------|---------|--------|-----|
| monthlyPrice | R$ 197 | R$ 497 | R$ 997 |
| maxConveniados | 10 | 50 | 200 |
| maxVehicles | 50 | 300 | 2000 |
| maxTransactionsIncluded | 1000 | 5000 | 20000 |
| extraTransactionPrice | R$ 0,50 | R$ 0,40 | R$ 0,30 |
| maxProviderPlans | 3 | 10 | 50 |
| whitelabelType | NONE | SUBDOMAIN | CUSTOM_DOMAIN |
| trialDays | 14 | 14 | 14 |
| trialMaxConveniados | 3 | 5 | 10 |
| suspensionMode | FULL_BLOCK | FULL_BLOCK | BLOCK_AUTH_ONLY |
| gracePeriodDays | 5 | 7 | 10 |

> **Nota:** Valores de preço são iniciais e devem ser configuráveis via admin.

### 6.2 Registro de Provider

#### Fluxo

```mermaid
sequenceDiagram
  participant U as Usuário
  participant PS as Portal Solution
  participant API as Server API
  participant DB as PostgreSQL
  participant E as Email Adapter

  U->>PS: Acessa /register
  U->>PS: Preenche formulário
  PS->>API: POST /providers/register
  API->>DB: Criar Provider (PENDING_VERIFICATION)
  API->>DB: Criar User (PROVIDER_ADMIN, PENDING_VERIFICATION)
  API->>DB: Criar EmailVerificationToken
  API->>E: Enviar email com link de verificação
  API-->>PS: 201 { providerId, message }

  U->>PS: Clica no link do email
  PS->>API: POST /auth/verify-email { token }
  API->>DB: Marcar token como usado
  API->>DB: User.status = ACTIVE, emailVerifiedAt = now()
  API->>DB: Provider.status = TRIAL_ACTIVE
  API->>DB: Criar SaasSubscription (TRIAL, plano Starter)
  API-->>PS: 200 { redirect: /onboarding }
```

#### Dados do Formulário de Registro

**Provider:**
- Razão social (obrigatório)
- Nome fantasia (obrigatório)
- CNPJ (obrigatório, validado: formato + dígitos verificadores)
- Endereço completo (obrigatório)
- Telefone (opcional)
- Email administrativo (obrigatório, será email do admin user)

**Usuário Admin:**
- Nome completo (obrigatório)
- Email (obrigatório, será o login)
- Senha (obrigatório, mínimo 8 caracteres, ao menos 1 maiúscula, 1 número)
- Aceite de termos de uso (obrigatório)

#### Regras

- CNPJ deve ser único no sistema (um CNPJ = um provider)
- Email do admin deve ser único no sistema
- Token de verificação: UUID, expira em 24h
- Após verificação, provider entra em **TRIAL_ACTIVE** com plano Starter
- Trial inicia automaticamente, sem necessidade de dados de pagamento

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/providers/register` | Registrar novo provider | Público |
| GET | `/providers/plans` | Listar planos SaaS disponíveis | Público |
| GET | `/providers/:id` | Dados do provider | PROVIDER_ADMIN |
| PATCH | `/providers/:id` | Atualizar dados do provider | PROVIDER_ADMIN |

### 6.3 Onboarding Engine

#### Checklist (armazenado em `Provider.onboardingState`)

```json
{
  "completedSteps": [],
  "steps": {
    "PROFILE_COMPLETED": false,
    "CREDIT_POLICY_CONFIGURED": false,
    "FIRST_CONVENIADO_CREATED": false,
    "FIRST_VEHICLE_REGISTERED": false,
    "FIRST_SIMULATION_DONE": false,
    "PLAN_CHOSEN": false
  }
}
```

#### Regras

- Onboarding é orientativo, não bloqueante (provider pode usar o sistema sem completar)
- Cada step é marcado automaticamente quando a ação correspondente é executada
- Portal exibe barra de progresso e CTAs contextuais
- Step `PLAN_CHOSEN` é marcado quando provider escolhe plano (durante ou após trial)

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/onboarding/status` | Estado atual do onboarding | PROVIDER_ADMIN |
| POST | `/onboarding/skip` | Marcar onboarding como ignorado | PROVIDER_ADMIN |

### 6.4 Billing SaaS (Integração Asaas)

#### Fluxo de Assinatura

```mermaid
stateDiagram-v2
  [*] --> TRIAL: Registro + verificação
  TRIAL --> ACTIVE: Pagamento confirmado
  TRIAL --> CANCELED: Trial expirado sem pagamento

  ACTIVE --> PAST_DUE: Pagamento falhou
  PAST_DUE --> ACTIVE: Pagamento confirmado
  PAST_DUE --> SUSPENDED: Grace period expirado

  SUSPENDED --> ACTIVE: Pagamento confirmado
  SUSPENDED --> CANCELED: Cancelamento manual/definitivo
  ACTIVE --> CANCELED: Cancelamento voluntário
```

#### Regras de Trial

- Duração: configurável por plano (default 14 dias)
- Limites durante trial: `trialMaxConveniados` do plano
- 7 dias antes do fim: notificação `TRIAL_EXPIRING_7D`
- 1 dia antes do fim: notificação `TRIAL_EXPIRING_1D`
- No dia do fim: se não escolheu plano → `TRIAL_EXPIRED`, Provider.status = `CANCELED`
- Provider pode escolher plano e inserir dados de pagamento a qualquer momento durante trial

#### Regras de Billing

- Cobrança recorrente mensal via Asaas
- Formas de pagamento: cartão de crédito, boleto, Pix
- Apuração de uso variável: contagem de transações no período → se exceder `maxTransactionsIncluded`, gera cobrança extra
- Invoice gerada automaticamente no início de cada período
- Webhooks Asaas processados com idempotência (`gatewayEventId` unique)

#### Regras de Inadimplência

- Pagamento falhou → `SaasSubscription.status = PAST_DUE`, `Provider.status = PAST_DUE`
- Grace period (configurável por plano, default 5 dias)
- Durante grace period: sistema opera normalmente, notificações de cobrança enviadas
- Após grace period → `SaasSubscription.status = SUSPENDED`, `Provider.status = SUSPENDED`
- Efeito da suspensão depende do `SuspensionMode` do plano:
  - `FULL_BLOCK`: bloqueia todas as operações (portais retornam tela de suspensão)
  - `BLOCK_AUTH_ONLY`: bloqueia apenas novas autorizações de abastecimento
- Após pagamento confirmado → reativação automática para `ACTIVE`

#### Integração Asaas

| Ação | API Asaas | Quando |
|------|-----------|--------|
| Criar customer | `POST /customers` | Ao escolher plano |
| Criar assinatura | `POST /subscriptions` | Ao confirmar pagamento |
| Consultar status | `GET /subscriptions/{id}` | Sob demanda |
| Webhook payment | `POST /webhooks/asaas` | Callback do Asaas |

Webhooks Asaas esperados:
- `PAYMENT_CONFIRMED` → marcar invoice como paga, reativar se necessário
- `PAYMENT_OVERDUE` → marcar como past_due
- `PAYMENT_DELETED` → cancelar invoice
- `PAYMENT_RECEIVED` → confirmar recebimento (boleto/pix)

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/billing/subscription` | Status da assinatura | PROVIDER_ADMIN |
| POST | `/billing/subscribe` | Escolher plano e iniciar assinatura | PROVIDER_ADMIN |
| POST | `/billing/change-plan` | Alterar plano (upgrade/downgrade) | PROVIDER_ADMIN |
| POST | `/billing/cancel` | Cancelar assinatura | PROVIDER_ADMIN |
| GET | `/billing/invoices` | Listar faturas SaaS | PROVIDER_ADMIN |
| GET | `/billing/invoices/:id` | Detalhe de fatura SaaS | PROVIDER_ADMIN |
| POST | `/webhooks/asaas` | Webhook do Asaas | Público (validar signature) |

### 6.5 Admin Acception (APIs básicas)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/admin/providers` | Listar providers (filtros: status, plan, search) | ACCEPTION_ADMIN |
| GET | `/admin/providers/:id` | Detalhe do provider | ACCEPTION_ADMIN |
| PATCH | `/admin/providers/:id/status` | Alterar status manualmente | ACCEPTION_ADMIN |
| POST | `/admin/providers/:id/impersonate` | Iniciar sessão como provider (auditado) | ACCEPTION_ADMIN |
| GET | `/admin/metrics/saas` | Métricas SaaS (MRR, churn, trials) | ACCEPTION_ADMIN |
| GET | `/admin/plans` | Listar planos SaaS | ACCEPTION_ADMIN |
| POST | `/admin/plans` | Criar plano SaaS | ACCEPTION_ADMIN |
| PATCH | `/admin/plans/:id` | Atualizar plano SaaS | ACCEPTION_ADMIN |

### 6.6 Critérios de Aceite — F1.B

- [ ] Provider consegue se registrar via formulário com validação de CNPJ
- [ ] Email de verificação é enviado (via adapter) com token válido
- [ ] Após verificação, provider está em TRIAL_ACTIVE com plano Starter
- [ ] Checklist de onboarding é exibido e atualizado automaticamente
- [ ] Provider consegue escolher plano e inserir dados de pagamento
- [ ] Webhook Asaas é processado com idempotência (reprocessar mesmo evento não causa duplicação)
- [ ] Trial expira corretamente após período configurado
- [ ] Inadimplência SaaS suspende provider conforme SuspensionMode
- [ ] Pagamento confirmado reativa provider automaticamente
- [ ] Admin Acception consegue listar e visualizar providers
- [ ] Impersonation gera audit log

---

## 7. F1.C — Crédito Core (Convênios + Ledger + Billing Provider)

### 7.1 Planos do Provider

#### Regras

- Provider pode criar até `maxProviderPlans` planos (definido pelo plano SaaS)
- Plano é versionado: ao editar, cria nova versão (versão anterior fica inativa)
- Conveniados vinculados à versão anterior continuam com as regras da versão ativa no momento da adesão
- Provider pode migrar conveniados para nova versão do plano manualmente
- Sistema fornece template default ao criar primeiro plano (valores conservadores)

#### Template Default

```json
{
  "name": "Plano Padrão",
  "globalLimit": 5000.00,
  "vehicleLimit": 1000.00,
  "monthlyLimit": 5000.00,
  "paymentTermDays": 30,
  "lateFeePercent": 2.00,
  "penaltyPercent": 1.00,
  "autoLockDays": 30,
  "requireOdometer": true,
  "pinThresholdAmount": 500.00,
  "minRefuelIntervalMin": 60
}
```

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/provider-plans` | Listar planos do provider | PROVIDER_ADMIN |
| POST | `/provider-plans` | Criar plano | PROVIDER_ADMIN |
| GET | `/provider-plans/:id` | Detalhe do plano | PROVIDER_ADMIN |
| PUT | `/provider-plans/:id` | Atualizar (cria nova versão) | PROVIDER_ADMIN |
| DELETE | `/provider-plans/:id` | Desativar plano (soft) | PROVIDER_ADMIN |

### 7.2 Gestão de Conveniados

#### Fluxo de Cadastro (Provider-Initiated)

```mermaid
sequenceDiagram
  participant PA as Provider Admin
  participant API as Server API
  participant DB as PostgreSQL
  participant E as Email Adapter

  PA->>API: POST /conveniados { cnpj, email, planId, ... }
  API->>API: Validar CNPJ, validar limite de conveniados do plano SaaS
  API->>DB: Criar Conveniado (PENDING_ACTIVATION)
  API->>DB: Criar CreditAccount (saldo 0, limite do plano)
  API->>DB: Gerar activationToken (UUID, expira 7 dias)
  API->>E: Enviar email CONVENIADO_INVITED com link
  API-->>PA: 201 { conveniadoId }

  Note over PA,E: Empresa recebe email

  PA->>API: Empresa clica no link
  API->>API: POST /conveniados/activate { token }
  API->>DB: Criar User CONVENIADO_ADMIN
  API->>DB: Conveniado.status = ACTIVE
  API->>E: Enviar CONVENIADO_ACTIVATED
  API-->>PA: 200 + redirect para definir senha
```

#### Regras

- CNPJ do conveniado deve ser único dentro do provider (mesmo CNPJ pode existir em providers diferentes)
- Limite de conveniados ativos respeitado conforme plano SaaS (incluindo trial)
- Token de ativação: UUID, expira em 7 dias
- Ao ativar, o conveniado define senha e aceita contrato digital
- CreditAccount é criado automaticamente com limite do ProviderPlan
- Provider pode alterar limite individual do conveniado (override do plano)

#### Status Transitions

```mermaid
stateDiagram-v2
  [*] --> PENDING_ACTIVATION: Provider cadastra
  PENDING_ACTIVATION --> ACTIVE: Empresa ativa
  ACTIVE --> BLOCKED: Provider bloqueia manualmente
  ACTIVE --> DELINQUENT: Fatura vencida (automático)
  DELINQUENT --> LOCKED: Atraso > autoLockDays (automático)
  DELINQUENT --> ACTIVE: Pagamento registrado
  BLOCKED --> ACTIVE: Provider desbloqueia
  LOCKED --> ACTIVE: Pagamento total + desbloqueio manual
  ACTIVE --> CLOSED: Provider encerra convênio
  BLOCKED --> CLOSED: Provider encerra
  LOCKED --> CLOSED: Provider encerra
```

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/conveniados` | Listar conveniados do provider | PROVIDER_* |
| POST | `/conveniados` | Cadastrar conveniado | PROVIDER_ADMIN |
| GET | `/conveniados/:id` | Detalhe | PROVIDER_*, CONVENIADO_ADMIN (próprio) |
| PATCH | `/conveniados/:id` | Atualizar dados | PROVIDER_ADMIN |
| POST | `/conveniados/:id/resend-activation` | Reenviar link | PROVIDER_ADMIN |
| POST | `/conveniados/activate` | Ativar conveniado | Público (token) |
| POST | `/conveniados/:id/block` | Bloquear manualmente | PROVIDER_ADMIN |
| POST | `/conveniados/:id/unblock` | Desbloquear | PROVIDER_ADMIN |
| POST | `/conveniados/:id/close` | Encerrar convênio | PROVIDER_ADMIN |
| POST | `/conveniados/:id/change-plan` | Alterar plano do conveniado | PROVIDER_ADMIN |

### 7.3 Frota (Veículos)

#### Regras

- Veículo pertence a um conveniado dentro de um provider
- Placa única por provider (mesmo veículo não pode estar em dois conveniados do mesmo provider)
- QR Code: UUID gerado automaticamente ao criar veículo
- QR Code deve ser imprimível (gerar imagem PNG/SVG para download)
- `vehicleLimit`: se definido, sobrepõe o `vehicleLimit` do ProviderPlan
- `lastOdometer` e `lastRefuelAt`: atualizados automaticamente após cada abastecimento efetivado
- Limite total de veículos respeitado conforme plano SaaS

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/conveniados/:id/vehicles` | Listar veículos | PROVIDER_*, CONVENIADO_ADMIN |
| POST | `/conveniados/:id/vehicles` | Cadastrar veículo | PROVIDER_ADMIN, CONVENIADO_ADMIN |
| GET | `/vehicles/:id` | Detalhe do veículo | PROVIDER_*, CONVENIADO_ADMIN |
| PATCH | `/vehicles/:id` | Atualizar | PROVIDER_ADMIN, CONVENIADO_ADMIN |
| DELETE | `/vehicles/:id` | Inativar veículo | PROVIDER_ADMIN, CONVENIADO_ADMIN |
| GET | `/vehicles/:id/qr-code` | Download do QR Code (PNG) | PROVIDER_*, CONVENIADO_ADMIN |

### 7.4 Centros de Custo

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/conveniados/:id/cost-centers` | Listar | PROVIDER_*, CONVENIADO_ADMIN |
| POST | `/conveniados/:id/cost-centers` | Criar | PROVIDER_ADMIN, CONVENIADO_ADMIN |
| PATCH | `/cost-centers/:id` | Atualizar | PROVIDER_ADMIN, CONVENIADO_ADMIN |
| DELETE | `/cost-centers/:id` | Desativar | PROVIDER_ADMIN, CONVENIADO_ADMIN |

### 7.5 Crédito & Ledger

#### CreditAccount

- Criado automaticamente ao cadastrar conveniado
- `globalLimit`: copiado do `ProviderPlan.globalLimit`, pode ser sobrescrito pelo provider
- `currentBalance`: saldo materializado (negativo = dívida)
- `reservedAmount`: soma das reservas ativas
- `availableCredit`: calculado como `globalLimit - abs(min(currentBalance, 0)) - reservedAmount`
- Todos os três campos atualizados **na mesma transação DB** ao gravar LedgerEntry

#### Operações no Ledger

| Operação | Tipo | Efeito no Balance | Efeito em Reserved |
|----------|------|-------------------|--------------------|
| Reservar crédito | RESERVE | — | +amount |
| Liberar reserva | RESERVE_RELEASE | — | -amount |
| Efetivar débito | DEBIT | -amount | -amount (da reserva) |
| Registrar pagamento | CREDIT | +amount | — |
| Estornar débito | REVERSAL | +amount | — |
| Ajuste manual | ADJUSTMENT | ±amount | — |
| Juros/multa | FEE | -amount | — |

#### Regra de Concorrência

Uso de `SELECT ... FOR UPDATE` na `CreditAccount` ao iniciar qualquer operação que altera saldo, garantindo serialização.

#### Reconciliação

- Job diário (cron) que recalcula saldo a partir das entries e compara com materializado
- Se divergência > R$ 0,01: gera alerta no audit log e notifica admin
- Não corrige automaticamente na F1 (correção manual via ADJUSTMENT)

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/conveniados/:id/credit` | Saldo e limites | PROVIDER_*, CONVENIADO_ADMIN |
| PATCH | `/conveniados/:id/credit/limit` | Alterar limite global | PROVIDER_ADMIN |
| GET | `/conveniados/:id/ledger` | Extrato (paginado, filtros: tipo, data) | PROVIDER_*, CONVENIADO_ADMIN |
| POST | `/conveniados/:id/credit/adjustment` | Ajuste manual (com justificativa) | PROVIDER_ADMIN |

### 7.6 Billing Provider (Contas a Receber)

#### Geração de Faturas

- **Ciclo**: mensal (dia 1 a último dia do mês)
- **Geração**: automática no 1º dia do mês seguinte (job/cron)
- **Vencimento**: `paymentTermDays` dias após o fim do período (do ProviderPlan)
- **Composição**: agrupa todos os débitos do período (LedgerEntries type=DEBIT) + fees
- **Numeração**: `INV-{YYYYMM}-{SEQ}` (sequencial por provider)

#### Fluxo

```mermaid
stateDiagram-v2
  [*] --> DRAFT: Job gera fatura
  DRAFT --> OPEN: Automaticamente após geração
  OPEN --> SENT: Provider envia (manual ou automático)
  SENT --> PAID: Pagamento total registrado
  SENT --> PARTIAL_PAID: Pagamento parcial
  PARTIAL_PAID --> PAID: Pagamento restante
  SENT --> PAST_DUE: Data vencimento ultrapassada
  PAST_DUE --> PAID: Pagamento registrado
  PAST_DUE --> LOCKED: Atraso > autoLockDays
  OPEN --> CANCELED: Provider cancela
```

#### Inadimplência do Conveniado

1. Fatura vence → status muda para `PAST_DUE`
2. Conveniado.status muda para `DELINQUENT` automaticamente
3. Notificação `INVOICE_PAST_DUE` enviada
4. Se atraso > `autoLockDays` (do ProviderPlan):
   - Conveniado.status = `LOCKED`
   - CreditAccount.lockedAt = now()
   - Notificação `CONVENIADO_LOCKED`
   - Todas as autorizações são negadas (regra AF-002)
5. Após pagamento total + desbloqueio manual pelo provider → volta para `ACTIVE`

#### Regras

- Provider pode registrar pagamento manual (cash, Pix, transferência)
- Pagamento parcial atualiza `paidAmount` e registra CREDIT no ledger
- Provider pode cancelar fatura (com justificativa, registrada em audit)
- Na F1, sem integração com gateway para cobrança do conveniado (apenas manual)
- Juros e multa: calculados automaticamente sobre faturas vencidas conforme ProviderPlan

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/conveniados/:id/invoices` | Listar faturas | PROVIDER_*, CONVENIADO_ADMIN |
| GET | `/invoices/:id` | Detalhe da fatura com itens | PROVIDER_*, CONVENIADO_ADMIN |
| POST | `/invoices/:id/send` | Marcar como enviada (envia email) | PROVIDER_ADMIN |
| POST | `/invoices/:id/payments` | Registrar pagamento manual | PROVIDER_ADMIN, PROVIDER_OPERATOR |
| POST | `/invoices/:id/cancel` | Cancelar fatura | PROVIDER_ADMIN |
| GET | `/invoices/:id/pdf` | Download PDF da fatura | PROVIDER_*, CONVENIADO_ADMIN |
| POST | `/billing-provider/generate` | Forçar geração de faturas (manual) | PROVIDER_ADMIN |

### 7.7 Critérios de Aceite — F1.C

- [ ] Provider consegue criar plano de convênio com todos os parâmetros
- [ ] Provider consegue cadastrar conveniado e link de ativação é enviado
- [ ] Empresa consegue ativar conta via link e definir senha
- [ ] CreditAccount é criado automaticamente com limite do plano
- [ ] Veículo é cadastrado com QR Code gerado automaticamente
- [ ] QR Code é exportável como imagem
- [ ] Ledger registra todas as operações como append-only
- [ ] Saldo materializado é atualizado sincronamente
- [ ] Fatura mensal é gerada automaticamente com itens corretos
- [ ] Pagamento manual registrado atualiza saldo e status da fatura
- [ ] Inadimplência automática: DELINQUENT após vencimento, LOCKED após autoLockDays
- [ ] Ajuste manual gera entrada no ledger e audit log com justificativa

---

## 8. F1.D — Autorização + Antifraude + App Frentista

### 8.1 Catálogo de Produtos

#### Regras

- Provider cadastra seus produtos (combustíveis)
- Price list com vigência: a lista ativa mais recente é usada para autorização
- Ao criar nova price list, a anterior é desativada automaticamente
- Preço unitário usado para calcular `totalAmount = liters × unitPrice`

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/products` | Listar produtos do provider | PROVIDER_* |
| POST | `/products` | Criar produto | PROVIDER_ADMIN |
| PATCH | `/products/:id` | Atualizar | PROVIDER_ADMIN |
| GET | `/price-lists` | Listar price lists | PROVIDER_* |
| POST | `/price-lists` | Criar nova price list (com itens) | PROVIDER_ADMIN |
| GET | `/price-lists/current` | Price list vigente | PROVIDER_*, APP_FRENTISTA |

### 8.2 Policy Engine

#### Contrato

**Entrada:**
```typescript
interface AuthorizationRequest {
  providerId: string;
  conveniadoId: string;
  vehicleId: string;
  productId?: string;
  liters?: number;
  totalAmount: number;
  odometer?: number;
  operatorId: string;
  latitude?: number;
  longitude?: number;
  externalTxId: string;
}
```

**Saída:**
```typescript
interface AuthorizationResult {
  decision: 'ALLOW' | 'DENY' | 'REVIEW';
  reasonCodes: string[];        // ex: ["AF-007", "AF-013"]
  requiredActions: StepUpAction[]; // ex: ["PIN_MANAGER"]
  policyVersion: string;        // versão do catálogo de regras
  ruleHits: RuleHit[];          // detalhamento por regra avaliada
}

interface RuleHit {
  ruleCode: string;
  ruleName: string;
  passed: boolean;
  decision?: 'DENY' | 'REVIEW';
  details?: Record<string, any>;
}
```

#### Ordem de Avaliação

As regras são avaliadas **sequencialmente** na ordem definida. Uma regra DENY interrompe a avaliação. Regras REVIEW acumulam.

Ver seção [10. Catálogo de Regras Antifraude](#10-catálogo-de-regras-antifraude-determinístico) para o catálogo completo.

### 8.3 Fluxo de Autorização de Abastecimento

```mermaid
sequenceDiagram
  autonumber
  participant F as App Frentista
  participant API as Server API
  participant PE as Policy Engine
  participant L as Ledger
  participant EV as Evidence Vault

  F->>API: POST /refuel/authorize {externalTxId, vehicleQrCode, liters, odometer, ...}
  API->>API: Resolver vehicle por qrCode → conveniado → provider
  API->>PE: Avaliar regras (context: saldos, limites, histórico)
  PE-->>API: { decision, reasonCodes, requiredActions }

  alt decision = DENY
    API->>API: RefuelTransaction.status = DENIED
    API-->>F: 200 { status: "DENIED", reasonCodes }
  else decision = REVIEW
    API->>API: RefuelTransaction.status = REVIEW
    API-->>F: 200 { status: "REVIEW", requiredActions }
    F->>F: Frentista executa step-up (PIN/foto)
    F->>API: POST /refuel/{id}/step-up {pin?, evidences?}
    API->>EV: Armazenar evidências
    API->>API: Validar step-up (PIN correto, foto recebida)
    API->>PE: Re-avaliar (se necessário)
    alt step-up OK
      API->>L: Criar RESERVE entry
      API->>API: RefuelTransaction.status = AUTHORIZED
      API-->>F: 200 { status: "AUTHORIZED", reserveId }
    else step-up falhou
      API->>API: RefuelTransaction.status = DENIED
      API-->>F: 200 { status: "DENIED", reason: "STEP_UP_FAILED" }
    end
  else decision = ALLOW
    API->>L: Criar RESERVE entry
    API->>API: RefuelTransaction.status = AUTHORIZED
    API-->>F: 200 { status: "AUTHORIZED", reserveId }
  end

  Note over F,API: Frentista realiza abastecimento

  F->>API: POST /refuel/{id}/complete {actualLiters?, odometer?, evidences?}
  API->>L: RESERVE_RELEASE + DEBIT (na mesma transação)
  API->>API: Atualizar Vehicle (lastOdometer, lastRefuelAt)
  API->>API: RefuelTransaction.status = POSTED
  API-->>F: 200 { status: "POSTED", receipt }
```

#### Regras do Fluxo

- **Idempotência**: `externalTxId` + `providerId` é unique. Requisição duplicada retorna resultado anterior
- **Reserva**: bloqueia crédito por até 15 minutos (configurável). Se não completar, expira automaticamente
- **Complete**: converte reserva em débito. Valor pode ser ajustado (actual ≤ reserved)
- **Cancelamento**: `POST /refuel/{id}/cancel` libera a reserva sem debitar
- **Estorno**: `POST /refuel/{id}/reverse` após POSTED cria REVERSAL no ledger (requer PROVIDER_ADMIN)

#### Expiração de Reservas

- Job periódico (a cada 5 minutos) verifica reservas com `expiresAt < now()`
- Para cada reserva expirada: cria `RESERVE_RELEASE`, atualiza `CreditAccount`, status = `EXPIRED`

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/refuel/authorize` | Solicitar autorização | PROVIDER_OPERATOR, PROVIDER_MANAGER |
| POST | `/refuel/:id/step-up` | Enviar step-up (PIN, evidências) | PROVIDER_OPERATOR, PROVIDER_MANAGER |
| POST | `/refuel/:id/complete` | Completar abastecimento | PROVIDER_OPERATOR, PROVIDER_MANAGER |
| POST | `/refuel/:id/cancel` | Cancelar (liberar reserva) | PROVIDER_OPERATOR, PROVIDER_MANAGER |
| POST | `/refuel/:id/reverse` | Estornar (após posted) | PROVIDER_ADMIN |
| GET | `/refuel/:id` | Detalhe da transação | PROVIDER_*, CONVENIADO_ADMIN |
| GET | `/refuel` | Listar transações (filtros) | PROVIDER_*, CONVENIADO_ADMIN |
| GET | `/vehicles/:id/resolve` | Resolver veículo por QR Code | PROVIDER_OPERATOR |

### 8.4 Evidence Vault

#### Regras

- Evidências vinculadas a `RefuelTransaction`
- Upload via multipart/form-data
- Armazenadas em S3/MinIO com key: `{providerId}/{conveniadoId}/evidence/{refuelId}/{uuid}.{ext}`
- SHA-256 hash calculado no upload e armazenado para integridade
- Acesso controlado: somente users do provider ou do conveniado correspondente
- Na F1, storage adapter abstrato (MinIO local em dev, S3 em prod)

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/refuel/:id/evidences` | Upload de evidência | PROVIDER_OPERATOR, PROVIDER_MANAGER |
| GET | `/refuel/:id/evidences` | Listar evidências | PROVIDER_*, CONVENIADO_ADMIN |
| GET | `/evidences/:id/download` | Download do arquivo | PROVIDER_*, CONVENIADO_ADMIN |

### 8.5 App Frentista (Flutter)

#### Telas

1. **Login**: email + senha (role PROVIDER_OPERATOR ou PROVIDER_MANAGER)
2. **Home**: botão "Novo Abastecimento" + lista de recentes
3. **Scan QR**: câmera para escanear QR do veículo
4. **Dados do Abastecimento**: produto (select), litros, odômetro (obrigatório se configurado)
5. **Resultado**: ALLOW (verde), DENY (vermelho + motivos), REVIEW (amarelo + ações)
6. **Step-up PIN**: tela para gerente inserir PIN
7. **Step-up Foto**: câmera para foto do hodômetro
8. **Completar**: confirmar litros finais, odômetro final
9. **Recibo**: resumo da transação

#### Fluxo Offline (Pré-captura)

1. App detecta sem conexão
2. Permite registrar dados (QR, litros, odômetro) localmente
3. Marca como `PRE_CAPTURED` (não debita, não reserva)
4. Ao reconectar, submete automaticamente para `/refuel/authorize`
5. Se negado: alerta ao operador
6. Se aprovado: segue fluxo normal

#### Regras

- Requer conexão para efetuar autorização e débito (nunca offline)
- Pré-captura offline: máximo 5 transações pendentes
- Geolocalização capturada automaticamente (se disponível)
- QR scan com câmera nativa
- PIN do gerente: validado no servidor (não localmente)

### 8.6 Critérios de Aceite — F1.D

- [ ] Frentista consegue escanear QR e iniciar autorização
- [ ] Policy Engine avalia todas as regras na ordem correta
- [ ] Resultado ALLOW cria reserva e permite completar
- [ ] Resultado DENY retorna reason codes claros
- [ ] Resultado REVIEW exige step-up antes de autorizar
- [ ] PIN do gerente é validado no servidor
- [ ] Foto do hodômetro é armazenada com hash
- [ ] Reserva expira após 15 minutos automaticamente
- [ ] Estorno reverte débito corretamente no ledger
- [ ] Idempotência: mesma requisição retorna mesmo resultado
- [ ] Transação completa gera débito no ledger e atualiza saldo
- [ ] P95 da autorização ≤ 300ms (em carga SMB típica)
- [ ] Pré-captura offline funciona e sincroniza ao reconectar

---

## 9. F1.E — White-label + Portais Completos

### 9.1 White-label

#### Configuração por Plano

| Plano | White-label | Formato |
|-------|-------------|---------|
| Starter | Não | Acessa via portal-solution shared |
| Growth | Sim | Subdomínio: `{slug}.acpt.app` |
| Pro | Sim | Domínio próprio: `fiado.postoxyz.com.br` |

#### Fluxo de Provisionamento — Subdomínio

1. Provider Growth+ define slug (ex: `postoxyz`)
2. Sistema cria registro em `ProviderDomain`: `postoxyz.acpt.app`, type=SUBDOMAIN
3. DNS wildcard `*.acpt.app` resolve para o load balancer (pré-configurado)
4. Backend resolve `providerId` pelo header `Host`
5. Portais carregam branding do provider

#### Fluxo de Provisionamento — Domínio Próprio

1. Provider Pro+ informa domínio (ex: `fiado.postoxyz.com.br`)
2. Provider configura CNAME no seu DNS apontando para `proxy.acpt.app`
3. Sistema verifica resolução DNS
4. Após verificação: emissão de certificado SSL (Let's Encrypt / Caddy)
5. `ProviderDomain.verified = true`

#### Branding

- Logo, favicon, cores (primary, secondary, accent)
- Upload de logo via storage adapter
- CSS customizado (opcional, restrito)
- Aplicado em portais Vue via tema Vuetify dinâmico

#### APIs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/whitelabel/config` | Configuração do provider (branding + domínio) | PROVIDER_ADMIN |
| PUT | `/whitelabel/branding` | Atualizar branding | PROVIDER_ADMIN |
| POST | `/whitelabel/domain` | Configurar domínio | PROVIDER_ADMIN |
| POST | `/whitelabel/domain/verify` | Verificar DNS | PROVIDER_ADMIN |
| GET | `/whitelabel/resolve` | Resolver provider por domínio (para portais) | Público |

### 9.2 Portal Provider (Vue 3 + Vuetify)

#### Áreas

**Operacional:**
- Dashboard: resumo financeiro, alertas, atividade recente
- Conveniados: lista, detalhe, cadastro, bloqueio
- Crédito: saldos, extratos, ajustes
- Faturas: lista, detalhe, registrar pagamento, enviar
- Transações: lista de abastecimentos, filtros, detalhe
- Relatórios: consumo por período, por conveniado, por veículo

**Admin:**
- Usuários: CRUD de operadores e gerentes
- Planos do Provider: CRUD
- Produtos e Preços: catálogo, price list
- Configurações: dados do posto, contrato template
- White-label: branding, domínio
- Assinatura SaaS: plano atual, faturas, upgrade

### 9.3 Portal Conveniado (Vue 3 + Vuetify)

- Dashboard: saldo disponível, consumo no mês, faturas pendentes
- Frota: veículos (CRUD), QR codes, centros de custo
- Extrato: histórico de transações, filtros
- Faturas: lista, detalhe, download PDF
- Configurações: dados da empresa, usuários (F1: apenas admin)

### 9.4 Portal Acception (Vue 3 + Vuetify)

- Dashboard: métricas SaaS (MRR, ARR, churn, trials ativos, tenants por plano)
- Providers: lista, detalhe, status, impersonation
- Planos SaaS: gestão
- Billing: faturas SaaS, inadimplências
- Alertas: tenants em risco, anomalias

### 9.5 Portal Solution (Vue 3 + Vuetify)

- Landing page: proposta de valor, planos, CTA registro
- Registro: formulário de novo provider
- Login: redireciona para portal-provider (ou portal-conveniado conforme role)

### 9.6 Critérios de Aceite — F1.E

- [ ] Provider Growth+ consegue configurar subdomínio e acessar portal via subdomínio
- [ ] Provider Pro+ consegue configurar domínio próprio com verificação DNS
- [ ] Branding (logo, cores) é aplicado corretamente nos portais
- [ ] Portal Provider: todas as funcionalidades operacionais e admin funcionais
- [ ] Portal Conveniado: dashboard, frota, extrato, faturas funcionais
- [ ] Portal Acception: métricas SaaS e gestão de providers funcional
- [ ] Portal Solution: registro de provider funcional end-to-end
- [ ] Resolução de provider por domínio funciona corretamente

---

## 10. Catálogo de Regras Antifraude (Determinístico)

Regras avaliadas sequencialmente pelo Policy Engine. Regra DENY interrompe. Regras REVIEW acumulam.

### Regras de Bloqueio (DENY)

| Código | Nome | Condição | Decisão |
|--------|------|----------|---------|
| AF-001 | TENANT_SUSPENDED | Provider.status = SUSPENDED | DENY |
| AF-002 | CONVENIADO_LOCKED | Conveniado.status IN (LOCKED, BLOCKED, CLOSED) | DENY |
| AF-003 | CONVENIADO_DELINQUENT | Conveniado.status = DELINQUENT AND atraso > autoLockDays | DENY |
| AF-004 | VEHICLE_INACTIVE | Vehicle.status = INACTIVE | DENY |
| AF-005 | PRODUCT_NOT_ALLOWED | productId NOT IN allowedProductIds (se lista não vazia) | DENY |
| AF-006 | OUTSIDE_HOURS | hora atual fora de allowedHoursStart–allowedHoursEnd | DENY |
| AF-007 | CREDIT_LIMIT_EXCEEDED | totalAmount > CreditAccount.availableCredit | DENY |
| AF-008 | VEHICLE_LIMIT_EXCEEDED | spend_hoje_veículo + totalAmount > vehicleLimit | DENY |
| AF-009 | DAILY_LIMIT_EXCEEDED | spend_dia_conveniado + totalAmount > dailyLimit | DENY |
| AF-010 | WEEKLY_LIMIT_EXCEEDED | spend_semana_conveniado + totalAmount > weeklyLimit | DENY |
| AF-011 | MONTHLY_LIMIT_EXCEEDED | spend_mês_conveniado + totalAmount > monthlyLimit | DENY |
| AF-012 | DUPLICATE_TX | externalTxId já existe para este provider | DENY (retorna resultado anterior) |
| AF-013 | MAX_TRANSACTION_EXCEEDED | totalAmount > maxTransactionAmount | DENY |

### Regras de Revisão (REVIEW + Step-up)

| Código | Nome | Condição | Decisão | Step-up |
|--------|------|----------|---------|---------|
| AF-020 | HIGH_VALUE_PIN | totalAmount > pinThresholdAmount | REVIEW | PIN_MANAGER |
| AF-021 | HIGH_VALUE_PHOTO | totalAmount > photoThresholdAmount | REVIEW | PHOTO_ODOMETER |
| AF-022 | FREQUENT_REFUEL | (now - Vehicle.lastRefuelAt) < minRefuelIntervalMin | REVIEW | PIN_MANAGER |
| AF-023 | ANOMALOUS_KML | km/l calculado fora da faixa aceitável (±50% da média) | REVIEW | PHOTO_ODOMETER |
| AF-024 | FIRST_VEHICLE_REFUEL | Vehicle.lastRefuelAt IS NULL (primeiro abastecimento) | REVIEW | PHOTO_ODOMETER |
| AF-025 | ODOMETER_REGRESSION | odometer < Vehicle.lastOdometer | REVIEW | PHOTO_ODOMETER |

### Cálculo de km/l (AF-023)

```
km_percorrido = odometer_atual - Vehicle.lastOdometer
kml_calculado = km_percorrido / liters

// Faixa aceitável: média histórica ±50%
// Se sem histórico suficiente (< 3 abastecimentos): regra não se aplica
// Média calculada dos últimos 10 abastecimentos do veículo
```

### Configuração por ProviderPlan

Cada regra pode ser efetivamente desabilitada via configuração:
- `pinThresholdAmount = null` → AF-020 não se aplica
- `photoThresholdAmount = null` → AF-021 não se aplica
- `minRefuelIntervalMin = null` → AF-022 não se aplica
- `requireOdometer = false` → AF-023, AF-025 não se aplicam
- `allowedHoursStart = null` → AF-006 não se aplica
- `allowedProductIds = []` → AF-005 não se aplica (todos permitidos)

### Versionamento

- Policy Engine tem versão (string semver, ex: `"1.0.0"`)
- Versão é registrada em cada `RefuelTransaction.policyVersion`
- Permite rastrear qual conjunto de regras foi usado em cada decisão

---

## 11. Catálogo de Notificações

| Código | Evento | Destinatário | Canal |
|--------|--------|-------------|-------|
| PROVIDER_WELCOME | Provider registrado | Provider admin | EMAIL |
| EMAIL_VERIFICATION | Verificar email | Usuário | EMAIL |
| PASSWORD_RESET | Reset de senha | Usuário | EMAIL |
| TRIAL_STARTED | Trial ativado | Provider admin | EMAIL |
| TRIAL_EXPIRING_7D | Trial expira em 7 dias | Provider admin | EMAIL |
| TRIAL_EXPIRING_1D | Trial expira amanhã | Provider admin | EMAIL |
| TRIAL_EXPIRED | Trial expirado | Provider admin | EMAIL |
| SAAS_PAYMENT_CONFIRMED | Pagamento SaaS confirmado | Provider admin | EMAIL |
| SAAS_PAYMENT_FAILED | Pagamento SaaS falhou | Provider admin | EMAIL |
| SAAS_PAST_DUE | Assinatura em atraso | Provider admin | EMAIL |
| SAAS_SUSPENDED | Tenant suspenso | Provider admin | EMAIL |
| CONVENIADO_INVITED | Link de ativação | Contato conveniado | EMAIL |
| CONVENIADO_ACTIVATED | Conveniado ativado | Conveniado admin + Provider admin | EMAIL |
| INVOICE_GENERATED | Fatura mensal gerada | Conveniado admin | EMAIL |
| INVOICE_DUE_REMINDER_7D | Fatura vence em 7 dias | Conveniado admin | EMAIL |
| INVOICE_DUE_REMINDER_1D | Fatura vence amanhã | Conveniado admin | EMAIL |
| INVOICE_PAST_DUE | Fatura vencida | Conveniado admin + Provider admin | EMAIL |
| CONVENIADO_LOCKED | Conveniado bloqueado | Conveniado admin + Provider admin | EMAIL |

Todos os templates são parametrizáveis com variáveis (`{{providerName}}`, `{{invoiceNumber}}`, etc.) e suportam locale `pt-BR`.

---

## 12. Fora do Escopo (Fase 1)

Os itens abaixo **não** fazem parte da Fase 1:

- Serviço de IA (score crédito, fraude ML) → Fase 2
- Módulo de OS / Oficinas → Fase 3
- App Mecânico → Fase 3
- Parcerias multi-provider / limite compartilhado → Fase 4
- NFC para identificação de veículos → Futuro
- Renegociação parcelada de faturas → Futuro
- Row Level Security (RLS) no PostgreSQL → Futuro
- SMS / WhatsApp para notificações → Futuro
- Motorista como entidade obrigatória → Futuro
- Conveniado self-registration (empresa solicita convênio) → Futuro
- Gateway de pagamento para billing do provider (Asaas para conveniados) → Add-on futuro
- CMS do portal solution → Futuro
- Catálogo público de postos → Futuro
- Relatórios preditivos → Fase 2+
- Multi-idioma ativo (en-US, es-ES) → Preparado na estrutura, ativo apenas pt-BR

---

## 13. Riscos e Mitigações

| # | Risco | Impacto | Probabilidade | Mitigação |
|---|-------|---------|---------------|-----------|
| 1 | Vazamento de dados entre tenants | Crítico | Baixa | Scoping fail-fast em repositórios, testes automatizados de isolamento, audit log |
| 2 | Inconsistência no ledger | Crítico | Baixa | Append-only, transação ACID com SELECT FOR UPDATE, reconciliação diária |
| 3 | Fraude de abastecimento | Alto | Média | Policy Engine com 19 regras, step-up, evidências, QR por veículo |
| 4 | Inadimplência de conveniados | Alto | Alta | Limites conservadores, auto-lock, aging, alertas |
| 5 | Latência na autorização (>300ms) | Médio | Baixa | Saldos materializados, queries indexadas, sem IA na F1 |
| 6 | Downtime do gateway Asaas | Médio | Baixa | Webhooks idempotentes, retry, status intermediário |
| 7 | Complexidade do onboarding | Médio | Média | Wizard guiado, checklist não-bloqueante, templates default |
| 8 | Provider concedendo crédito irresponsável | Alto | Média | Dashboard com indicadores, alertas de concentração, limites do plano |

---

## 14. Registro de Decisões de Escopo e Evolução

Esta seção documenta cada decisão tomada durante a especificação da Fase 1 que foi deliberadamente simplificada para reduzir escopo inicial. Para cada decisão, registra-se: o contexto do problema, as alternativas avaliadas, a escolha feita, a justificativa e o caminho concreto de evolução futura.

> **Convenção:** Cada decisão é identificada como `DS-XXX` (Decision Scope) para rastreabilidade.

---

### DS-001 — Gateway de Pagamento SaaS

**Contexto:**
A plataforma precisa cobrar providers (postos) pela assinatura SaaS. A integração com gateway de pagamento é essencial para cobrança recorrente (cartão, boleto, Pix). Dois gateways brasileiros consolidados foram avaliados.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) Asaas** | API brasileira focada em cobranças, popular em SaaS SMB | API simples, sandbox disponível, boa cobertura Pix/Boleto/Cartão, documentação clara | Menos features avançadas de split/marketplace |
| **B) Pagar.me** | API da Stone, recorrência nativa | Robusta, suporte a recorrência nativa, bom para operações maiores | Mais complexidade de integração, processo de homologação mais longo |
| **C) Adapter abstrato** | Implementar apenas interface, billing manual, postergar gateway real | Reduz escopo máximo, sem dependência externa | Sem cobrança automatizada, experiência degradada, atrasa validação do billing |

**Escolha:** **A) Asaas**

**Justificativa:** API mais simples para MVP, sandbox disponível para desenvolvimento imediato, boa cobertura dos meios de pagamento brasileiros, popular no segmento SMB SaaS. O custo de integração inicial é menor que Pagar.me.

**Impacto no código F1:**
- Módulo `payment-gateway` implementa adapter Asaas
- Models `SaasInvoice.gatewayChargeId`, `SaasSubscription.gatewayCustomerId/gatewaySubscriptionId` são específicos Asaas
- Webhook endpoint `POST /webhooks/asaas` processa eventos Asaas

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| Adicionar Pagar.me como alternativa | Quando necessário (clientes enterprise) | Criar novo adapter `PagarmePaymentGateway` implementando mesma interface `PaymentGatewayPort`. Configurável por env `PAYMENT_GATEWAY_PROVIDER=asaas\|pagarme` |
| Multi-gateway por provider | Fase futura | Permitir provider escolher gateway preferido. Campo `preferredGateway` em Provider. Adapter resolvido em runtime |
| Gateway para billing provider | Add-on (qualquer fase) | Reutilizar adapter existente para cobrança automática dos conveniados pelo provider. Novo campo `SaasSubscription.addons[]` para habilitar |

**Preparação arquitetural (já feita na F1):**
- Interface `PaymentGatewayPort` no domain layer (não depende de implementação)
- Adapter Asaas na infrastructure layer
- Webhook handler genérico que delega para adapter

---

### DS-002 — Cadastro de Conveniados

**Contexto:**
Conveniados (empresas) precisam ser registrados no sistema do provider para operar. Dois modelos de registro foram identificados na documentação do produto.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) Apenas provider-initiated** | Provider cadastra empresa manualmente e envia link de ativação | Simples, controle total do provider, fluxo linear | Empresa não pode se auto-registrar; depende do provider |
| **B) Ambos os modelos** | Provider cria + empresa solicita convênio via portal white-label | Maior alcance, empresa pode descobrir o provider | Mais escopo (formulário público, workflow de aprovação, tela de solicitação no portal conveniado) |

**Escolha:** **A) Apenas provider-initiated**

**Justificativa:** Adequado para o cenário SMB da Fase 1, onde o relacionamento posto–empresa já existe presencialmente. Reduz significativamente o escopo do portal conveniado e elimina a necessidade de workflow de aprovação. O modelo B pode ser adicionado incrementalmente sem refatoração.

**Impacto no código F1:**
- Fluxo único: `POST /conveniados` (provider cria) → email com token → empresa ativa
- Não existe formulário público de solicitação no portal conveniado
- Não existe workflow de aprovação (status vai direto de PENDING_ACTIVATION para ACTIVE)

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| Self-registration do conveniado | Pós-F1 | Adicionar novo status `PENDING_APPROVAL` ao `ConveniadoStatus`. Criar endpoint público `POST /conveniados/request` no portal white-label. Implementar tela de aprovação no portal-provider. Notificação `CONVENIADO_REQUESTED` |
| Convite por link público | Pós-F1 | Provider gera link público de convênio (com planId embutido). Empresa preenche formulário e entra em PENDING_APPROVAL |
| Onboarding assistido | Futuro | Wizard mais completo para o conveniado recém-ativado, com importação de frota em massa (CSV/planilha) |

**Preparação arquitetural (já feita na F1):**
- Enum `ConveniadoStatus` já inclui estados que suportam o fluxo futuro
- `activationToken` e `activationTokenExpiresAt` já existem no model
- Separação entre criação (provider) e ativação (empresa) já modularizada

---

### DS-003 — Identificação de Veículo no App Frentista

**Contexto:**
O frentista precisa identificar qual veículo está sendo abastecido para iniciar a autorização. Métodos de identificação variam em custo, segurança e praticidade.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) QR Code apenas** | UUID por veículo, impresso em adesivo, escaneado pela câmera | Sem hardware adicional, custo zero, fácil implantação | Pode ser fotografado/copiado (mitigado por step-up e geo) |
| **B) QR Code + NFC** | QR como primário, NFC tag colada no veículo como secundário | Mais seguro (tag difícil de copiar), mais rápido | Custo de tags NFC (~R$2-5/veículo), nem todo celular tem NFC, logística de distribuição |
| **C) QR Code + código manual** | QR como primário, digitação do código como fallback | Pragmático para campo (QR danificado/sujo) | Digitação manual mais lenta e sujeita a erros |

**Escolha:** **A) QR Code apenas**

**Justificativa:** Custo zero de implantação, sem dependência de hardware adicional, adequado para MVP SMB. Segurança complementada por geolocalização, hodômetro e step-up. Maturidade suficiente para validar o modelo antes de investir em NFC.

**Impacto no código F1:**
- Model `Vehicle.qrCode` (UUID único)
- Endpoint `GET /vehicles/:id/qr-code` gera imagem PNG/SVG
- App frentista usa câmera nativa para scan
- Endpoint `GET /vehicles/:id/resolve` busca veículo por `qrCode`

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| Fallback por código manual | Pós-F1 (rápido) | Adicionar campo `Vehicle.shortCode` (6 chars alfanumérico). Tela no app para digitação. Endpoint `GET /vehicles/resolve?code=ABC123`. **Mudança mínima** |
| NFC tag | Fase futura | Adicionar campo `Vehicle.nfcTagId` (nullable). App detecta NFC e envia tagId no request. Endpoint resolve por `nfcTagId`. Logística: provider compra tags e associa via portal. **Mudança no model + tela no app** |
| Bluetooth OBD / telemetria | Fase 4+ | Integração com dispositivos OBD para captura automática de odômetro e identificação. **Escopo de integração maior** |

**Preparação arquitetural (já feita na F1):**
- `Vehicle.qrCode` é um UUID genérico — o resolve endpoint pode aceitar diferentes tipos de identificador
- O campo `qrCode` pode coexistir com `nfcTagId` e `shortCode` futuros
- O endpoint `/vehicles/:id/resolve` pode ser estendido com query param `type=qr|nfc|code`

---

### DS-004 — Roles de Conveniado

**Contexto:**
Usuários de empresas conveniadas precisam acessar o portal-conveniado. A questão é se devem existir sub-papéis (admin vs. viewer) desde o início ou se um papel único é suficiente.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) Papel único: CONVENIADO_ADMIN** | Todos os usuários do conveniado têm as mesmas permissões | Simplifica RBAC, menos guards, menos testes, foco no essencial | Empresa não pode dar acesso restrito a funcionários |
| **B) Dois papéis: ADMIN + VIEWER** | CONVENIADO_ADMIN (gestão) + CONVENIADO_VIEWER (apenas consulta) | Permite acesso limitado para funcionários da empresa | Mais complexidade no RBAC, guards duplicados, testes extras |

**Escolha:** **A) Papel único CONVENIADO_ADMIN**

**Justificativa:** Na Fase 1, o público SMB tipicamente tem 1-2 pessoas gerindo o convênio. A complexidade de múltiplos roles não justifica o valor agregado neste momento. O RBAC é projetado para suportar novos roles sem refatoração.

**Impacto no código F1:**
- Enum `UserRole` inclui apenas `CONVENIADO_ADMIN` para conveniados
- Guards verificam `role === CONVENIADO_ADMIN` para endpoints de conveniado
- Todos os usuários do conveniado têm acesso total (CRUD frota, ver extratos, ver faturas)

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| CONVENIADO_VIEWER | Pós-F1 | Adicionar `CONVENIADO_VIEWER` ao enum `UserRole`. Atualizar guards para distinguir read vs. write. Endpoints GET permanecem, endpoints POST/PATCH/DELETE restritos a ADMIN |
| CONVENIADO_MANAGER | Futuro | Papel intermediário: pode gerenciar frota e ver extratos, mas não pode alterar configurações. Útil para empresas médias |
| Permissões granulares | Futuro avançado | Migrar de roles fixos para tabela `Permission` + `RolePermission`. Provider pode criar roles customizados para seus conveniados |

**Preparação arquitetural (já feita na F1):**
- `UserRole` é um enum que aceita novos valores sem migração destrutiva
- Guards usam decorator `@Roles(...)` que aceita array — adicionar novo role é trivial
- Estrutura de scoping (`conveniadoId` no token) já existe e funciona independente do role

---

### DS-005 — Materialização de Saldos do Ledger

**Contexto:**
O requisito de P95 ≤ 300ms na autorização exige que os saldos estejam disponíveis rapidamente, sem agregar ledger entries on-demand. A estratégia de materialização impacta diretamente a consistência e complexidade do sistema.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) Síncrono no write** | Ao gravar ledger entry, atualiza `CreditAccount` na mesma transação DB (ACID) | Consistência forte, sem eventual consistency, simples de entender e debugar | Lock na CreditAccount (SELECT FOR UPDATE) pode ser gargalo em alta concorrência |
| **B) Assíncrono via eventos** | Ledger entry emite evento, consumer atualiza saldo | Menor acoplamento, melhor throughput de escrita | Eventual consistency — saldo pode estar desatualizado durante autorização. Risco de aprovar acima do limite |
| **C) Híbrido** | Saldo principal síncrono, read models secundários (spend_daily, spend_monthly) via cron/evento | Equilíbrio: saldo principal sempre consistente, métricas de período eventualmente consistentes | Mais complexidade, dois mecanismos de atualização |

**Escolha:** **A) Síncrono no write**

**Justificativa:** Para o cenário SMB (baixa concorrência por conveniado), o lock via SELECT FOR UPDATE não é gargalo. A consistência forte é essencial para crédito financeiro — não se pode aprovar uma transação com saldo desatualizado. Simplicidade > throughput neste contexto.

**Impacto no código F1:**
- Toda operação no ledger (RESERVE, DEBIT, CREDIT, etc.) é uma transação DB que inclui:
  1. `INSERT INTO ledger_entries ...`
  2. `UPDATE credit_accounts SET currentBalance = ..., reservedAmount = ..., availableCredit = ...`
- `SELECT ... FOR UPDATE` na CreditAccount antes de qualquer operação
- Read models de período (spend_daily, spend_monthly) calculados via query no ledger com índices

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| Read models de período materializados | Quando P95 > 200ms em produção | Adicionar tabela `SpendSummary(creditAccountId, vehicleId, period, periodStart, amount)`. Atualizar na mesma transação do ledger. Elimina queries com SUM na autorização |
| Migração para híbrido (evento) | Escala alta (>1000 tx/min por provider) | Manter saldo principal síncrono. Read models secundários via eventos (BullMQ/Redis). Aceitar eventual consistency para métricas não-críticas (dashboards, relatórios) |
| Event sourcing completo | Fase 4+ (multi-provider) | Ledger entries como eventos formais. Projeções materializadas por consumers. Essencial para liquidação inter-provider |

**Preparação arquitetural (já feita na F1):**
- LedgerEntry já é append-only (naturalmente compatível com event sourcing)
- `balanceAfter` em cada entry permite reconstrução do estado
- Reconciliação diária já compara materializado vs. calculado
- Índices `@@index([creditAccountId, createdAt])` otimizam queries de período

---

### DS-006 — Provedor de Email Transacional

**Contexto:**
O sistema precisa enviar emails transacionais (verificação, notificações, cobranças). Na Fase 1, o volume é baixo, mas a confiabilidade é importante para o fluxo de registro e ativação.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) AWS SES** | Serviço de email da AWS, custo baixo, alta entregabilidade | Custo baixíssimo (~$0.10/1000 emails), escala ilimitada, boa reputação | Requer domínio verificado, setup DNS (SPF/DKIM), sem templates visuais nativos |
| **B) SendGrid** | API de email popular, plano free generoso | API simples, templates visuais, 100 emails/dia grátis | Lock-in, custos crescem rápido |
| **C) Resend** | API moderna, DX excelente, React Email | Experiência de desenvolvedor superior, 100 emails/dia grátis | Serviço mais novo, menor histórico |
| **D) Adapter abstrato** | Interface no código, console/log em dev, provedor definido depois | Zero dependência externa, máxima flexibilidade, foco no core | Sem email real até definir provedor, fluxos de ativação apenas testáveis via logs |

**Escolha:** **D) Adapter abstrato**

**Justificativa:** Na Fase 1, o foco é validar lógica de negócio, não infraestrutura de email. O adapter permite desenvolvimento e testes completos sem dependência externa. Em dev/staging, emails são logados no console. O provedor real será escolhido quando o deploy em produção se aproximar, com base no volume projetado e infraestrutura escolhida.

**Impacto no código F1:**
- Interface `EmailPort` no domain layer: `sendEmail(to, template, vars): Promise<void>`
- Implementação `ConsoleEmailAdapter` (dev): loga subject + body no console
- `NotificationLog` registra todas as tentativas independente do adapter
- Env: `EMAIL_PROVIDER=console`

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| Escolher provedor real | Pré-produção | Criar `SesEmailAdapter` ou `ResendEmailAdapter` implementando `EmailPort`. Alterar env para `EMAIL_PROVIDER=ses\|resend`. **Nenhuma mudança em lógica de negócio** |
| Templates visuais | Pós-produção | Implementar templates HTML responsivos. Possível integração com MJML ou React Email para templates |
| SMS / WhatsApp | Futuro | Criar `SmsPort` e `WhatsAppPort` com adapters. `NotificationService` resolve canal por template/preferência do destinatário. Modelo `NotificationTemplate` já suporta múltiplos canais |

**Preparação arquitetural (já feita na F1):**
- `EmailPort` interface desacopla completamente o domain do provedor
- `NotificationTemplate` com campo `channel` já suporta EMAIL, SYSTEM (e futuro SMS, WHATSAPP)
- `NotificationLog` registra toda tentativa com status, permitindo retry e auditoria
- Env `EMAIL_PROVIDER` permite troca sem redeploy do código

---

### DS-007 — Unicidade de Email de Usuário

**Contexto:**
Em sistemas multi-tenant, a unicidade de email pode ser global (um email só existe uma vez no sistema) ou por tenant (o mesmo email pode existir em providers diferentes). Isso impacta o fluxo de login e a resolução de contexto.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) Email globalmente único** | `@@unique([email])` — um email = um usuário no sistema inteiro | Login simples (email + senha → resolução automática do provider), sem ambiguidade | Mesma pessoa não pode ser admin de um provider e funcionário de um conveniado de outro provider com o mesmo email |
| **B) Email único por tenant** | `@@unique([providerId, email])` — mesmo email pode existir em providers diferentes | Padrão multi-tenant clássico, sem restrição entre providers | Login precisa de contexto do provider (via subdomínio ou seleção), fluxo de login mais complexo para usuários do portal-solution (sem white-label) |

**Escolha:** **A) Email globalmente único**

**Justificativa:** Simplifica drasticamente o fluxo de autenticação na F1. O cenário de uma mesma pessoa administrando múltiplos providers ou sendo conveniado em dois providers diferentes é raro no público SMB inicial. Para providers Starter (sem white-label), o login via portal-solution precisa resolver o provider automaticamente — com email global, isso é trivial.

**Impacto no código F1:**
- `User.email` com `@unique` global
- Login resolve provider automaticamente a partir do email
- Registro valida unicidade global do email
- Não é necessário resolver provider antes do login

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| Email único por tenant | Quando providers pedirem | Migrar constraint de `@unique([email])` para `@@unique([providerId, email])`. Adicionar resolução de provider no login: (1) white-label → provider pelo domínio, (2) shared domain → pedir ao usuário qual provider. Migration SQL: `ALTER TABLE "User" DROP CONSTRAINT ... ; ALTER TABLE "User" ADD CONSTRAINT ... UNIQUE(provider_id, email)`. **Fluxo de login precisa ser adaptado** |
| Conta unificada cross-tenant | Futuro avançado | Separar identidade (Account) de autorização (User). Um Account com email pode ter múltiplos Users em diferentes providers. Login retorna lista de providers, usuário seleciona contexto. **Refatoração maior, modelo Account + UserMembership** |

**Preparação arquitetural (já feita na F1):**
- JWT já inclui `providerId` no payload — consumers não dependem de como o email foi resolvido
- `TenantContext` é desacoplado do mecanismo de login
- O model `User` já tem `providerId` como campo separado (não é derivado do email)

---

### DS-008 — Gateway de Pagamento do Provider (Billing Provider)

**Contexto:**
O provider precisa cobrar seus conveniados pelas faturas mensais de crédito. A cobrança pode ser manual (provider registra pagamento recebido) ou automatizada via gateway integrado.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) Cobrança manual apenas** | Provider registra pagamentos no portal (cash, Pix, transferência) | Zero complexidade de integração, zero custo adicional, fluxo familiar para SMB | Sem cobrança automatizada, sem link de pagamento, provider precisa cobrar por fora |
| **B) Gateway integrado desde o início** | Asaas/Pagar.me para gerar boletos/links Pix automaticamente | Conveniência, reduz inadimplência, profissionaliza cobrança | Complexidade de integração (onboarding de sub-merchant no gateway), custos de transação, fluxo de split |
| **C) Gateway como add-on** | Manual por padrão, gateway contratável como feature extra | Flexibilidade, monetização, provider decide | Dois fluxos para manter |

**Escolha:** **A) Cobrança manual apenas** (F1); **C) Gateway como add-on** (roadmap)

**Justificativa:** Na F1, providers SMB já cobram seus clientes presencialmente ou por Pix pessoal. O gateway integrado adiciona complexidade significativa (onboarding do provider no gateway, split, conciliação automática) sem ser essencial para o MVP. A documentação do produto já define gateway como add-on contratável.

**Impacto no código F1:**
- `ProviderPayment` com campo `method` (MANUAL, PIX, BOLETO, TRANSFER, CASH)
- Endpoint `POST /invoices/:id/payments` registra pagamento manualmente
- Sem integração com gateway para faturas do provider
- Sem geração automática de boleto/link Pix para o conveniado

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| Link de pagamento simples | Pós-F1 (rápido) | Provider gera link Pix/boleto via Asaas para fatura individual. Novo endpoint `POST /invoices/:id/payment-link`. Webhook de confirmação fecha fatura automaticamente. **Mudança menor** |
| Gateway completo (add-on) | Roadmap | Provider configura conta no gateway (Asaas sub-account). Faturas geram cobrança automática. Conciliação via webhook. Modelo `ProviderGatewayConfig(providerId, gatewayProvider, credentials, active)`. Add-on no `SaasSubscription.addons[]` |
| Split de pagamento | Fase 4 (parcerias) | Pagamento do conveniado dividido entre providers parceiros. Requer Asaas split ou Pagar.me marketplace. **Complexidade alta** |

**Preparação arquitetural (já feita na F1):**
- `ProviderPayment.method` já distingue métodos de pagamento
- `ProviderInvoice` tem campos para gateway futuro (extensível via migration)
- Módulo `payment-gateway` já existe e pode ser reutilizado para billing provider
- Interface `PaymentGatewayPort` é genérica — pode servir tanto SaaS quanto provider billing

---

### DS-009 — Entrega em Sub-fases Incrementais

**Contexto:**
A Fase 1 tem 9 épicos com interdependências. A forma de entrega impacta a velocidade de feedback, o risco e a capacidade de ajuste de rota.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) Sub-fases incrementais** | 5 entregas (F1.A→F1.E), cada uma com valor testável | Feedback antecipado, redução de risco, facilita priorização e paralelismo | Overhead de planejamento por sub-fase, necessidade de mocks/stubs temporários |
| **B) Bloco único** | Especificar e implementar como bloco monolítico | Menos overhead de coordenação, visão completa desde o início | Feedback tardio, risco acumulado, difícil ajustar rota, entrega "tudo ou nada" |

**Escolha:** **A) Sub-fases incrementais**

**Justificativa:** Permite validar fundação (auth, tenancy) antes de construir sobre ela. Cada sub-fase entrega valor testável. Problemas são detectados cedo. Paralelismo entre backend e frontend é facilitado (frontend pode iniciar na F1.E enquanto backend finaliza F1.D).

**Impacto no código F1:**
- Cada sub-fase é um marco com critérios de aceite verificáveis
- Stubs/mocks podem ser necessários para sub-fases iniciais (ex: email adapter console)
- APIs de sub-fases anteriores são estáveis quando sub-fases posteriores iniciam

**Evolução futura:**
- O mesmo padrão de sub-fases deve ser aplicado às Fases 2, 3 e 4
- Sub-fases podem ser reordenadas se prioridades mudarem (ex: se white-label for urgente, F1.E pode subir)
- Cada sub-fase pode gerar um release candidate para validação com usuários piloto

---

### DS-010 — Reserva de Crédito (TTL)

**Contexto:**
Entre a autorização e a finalização do abastecimento, o crédito precisa ser reservado para evitar que outro abastecimento simultâneo exceda o limite. O TTL define por quanto tempo o crédito fica bloqueado.

**Alternativas avaliadas:**

| Alternativa | Descrição | Prós | Contras |
|-------------|-----------|------|---------|
| **A) 15 minutos** | TTL curto, adequado para abastecimento rápido | Libera crédito rapidamente se abandonado, baixo risco de "crédito preso" | Pode ser apertado para postos movimentados (fila) |
| **B) 30 minutos** | TTL mais generoso | Mais confortável para situações reais | Crédito preso por mais tempo se app falhar |
| **C) Configurável por provider** | Provider define TTL no painel | Máxima flexibilidade | Mais complexidade de configuração |

**Escolha:** **A) 15 minutos** (configurável via env `RESERVE_TTL_MINUTES`)

**Justificativa:** Abastecimento típico leva 3-8 minutos. 15 minutos dá margem confortável incluindo step-up (foto, PIN). Configurável via env para ajuste sem redeploy. Se necessário, pode ser promovido a configuração por provider no futuro.

**Evolução futura:**

| Evolução | Quando | O que muda |
|----------|--------|------------|
| TTL configurável por provider | Se providers pedirem | Novo campo `ProviderSettings.reserveTtlMinutes`. Use case lê do provider antes de criar reserva. Migration + campo no portal admin |
| TTL por tipo de operação | Fase 3 (oficinas) | OS pode precisar de TTL mais longo (horas). Diferente de abastecimento. Campo `reserveTtlMinutes` por tipo de transação |

---

### Resumo das Evoluções por Prioridade

**Evoluções rápidas (pós-F1, baixo esforço):**
1. DS-003 → Fallback por código manual (shortCode no veículo)
2. DS-008 → Link de pagamento simples via Asaas
3. DS-004 → Adicionar CONVENIADO_VIEWER
4. DS-006 → Escolher provedor de email real (SES ou Resend)

**Evoluções médias (planejadas para fases 2-3):**
5. DS-002 → Self-registration do conveniado
6. DS-003 → NFC tag no veículo
7. DS-005 → Read models de período materializados
8. DS-008 → Gateway completo como add-on
9. DS-001 → Adicionar Pagar.me como alternativa

**Evoluções estruturais (fases 3-4+):**
10. DS-007 → Email único por tenant + fluxo de login com seleção de provider
11. DS-005 → Event sourcing para multi-provider
12. DS-008 → Split de pagamento entre providers

---

## Apêndice A — Configurações de Ambiente (.env)

### server-api

```env
PORT=5100
DATABASE_URL=postgresql://user:pass@localhost:5432/fiadoauto
JWT_SECRET=<secret-32-chars-min>
JWT_ACCESS_EXPIRATION=900        # 15 min em segundos
JWT_REFRESH_EXPIRATION=604800    # 7 dias em segundos

ASAAS_API_KEY=<api-key>
ASAAS_WEBHOOK_TOKEN=<webhook-secret>
ASAAS_SANDBOX=true               # true em dev/staging

STORAGE_PROVIDER=local           # local | s3
STORAGE_LOCAL_PATH=./uploads
S3_BUCKET=fiadoauto-evidence
S3_REGION=sa-east-1

EMAIL_PROVIDER=console           # console | ses | sendgrid | resend
EMAIL_FROM=noreply@acpt.app

RESERVE_TTL_MINUTES=15
RECONCILIATION_CRON=0 3 * * *   # 03:00 diário
RESERVE_EXPIRY_CRON=*/5 * * * * # a cada 5 min
INVOICE_GENERATION_CRON=0 1 1 * * # 01:00 do dia 1

WHITELABEL_BASE_DOMAIN=acpt.app
```

## Apêndice B — Jobs Agendados (Cron)

| Job | Schedule | Descrição |
|-----|----------|-----------|
| Expirar reservas | `*/5 * * * *` | Libera reservas com TTL expirado |
| Reconciliação ledger | `0 3 * * *` | Verifica consistência saldo vs entries |
| Gerar faturas provider | `0 1 1 * *` | Gera faturas mensais para todos os conveniados |
| Verificar trial expirando | `0 9 * * *` | Envia notificações de trial expirando |
| Verificar inadimplência SaaS | `0 10 * * *` | Aplica suspensão após grace period |
| Verificar inadimplência conveniado | `0 6 * * *` | Auto-lock conveniados com atraso > autoLockDays |
| Calcular juros/multa | `0 2 1 * *` | Aplica fees sobre faturas vencidas |
| Verificar faturas vencendo | `0 8 * * *` | Envia lembretes de vencimento (7d, 1d) |
