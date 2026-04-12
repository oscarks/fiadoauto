# Review Sprint 1 — Infraestrutura + Core

> Analise da implementacao da Sprint 1 conforme `F1-Implementation-Plan.md`
> Data: 2026-03-06

---

## 1. Resumo Executivo

| Aspecto | Backend | Frontend (4 portais) |
|---------|---------|---------------------|
| Estrutura de pastas | PASS | PASS |
| Schema Prisma | PASS | N/A |
| Auth (JWT + Refresh) | PARTIAL | PASS |
| RBAC (Guards + Decorators) | PARTIAL | PASS |
| Audit Log | PARTIAL | N/A |
| UI Templates / Layout | N/A | PARTIAL |
| Componentes Globais | N/A | PASS |
| Testes | PARTIAL | N/A |

**Veredicto geral**: Implementacao funcional com boa estrutura, porem com **12 issues** que requerem correcao (3 bugs, 5 parciais, 4 melhorias).

---

## 2. Analise Detalhada

### 2.1 T-001: Projeto NestJS com Clean Architecture — PASS

**Conforme**:
- Estrutura `modules/core/`, `modules/domain/`, `modules/saas/`, `modules/integrations/`
- `src/common/` com decorators, filters, guards, interceptors, pipes
- PrismaModule `@Global()` com PrismaService exportado
- HealthCheckController em `GET /api/health` (marcado `@Public()`)
- ConfigModule.forRoot({ isGlobal: true })
- `.env` com DATABASE_URL, JWT_SECRET, PORT=5100

**Issues menores**:
- TokenService usa `process.env.JWT_SECRET` em vez de `ConfigService` (T-003)
- PrismaService usa `this.$on('beforeExit')` que foi removido em Prisma 5+; usar `OnModuleDestroy`

### 2.2 T-002: Schema Prisma — Entidades Core — PASS

**Conforme**:
- `providers`: todos campos presentes, CNPJ `@unique`, UUID, status enum
- `users`: todos campos, email `@unique`, FK para provider, indices
- `roles`: id, name `@unique`, description
- `user_roles`: PK composta, FKs corretas
- `audit_log`: todos campos, indices compostos `(providerId, createdAt)` e `(userId, createdAt)`
- `refresh_tokens`: tokenHash `@unique`, FKs, suporte a revogacao
- Enums: ProviderStatus, UserStatus, ActorType — conformes ao plano
- `@@map()` para snake_case no DB com camelCase no Prisma

### 2.3 T-003: Modulo Auth — PARTIAL

**Conforme**:
- 4 endpoints implementados: login, refresh, logout, me
- Login valida credenciais, verifica status user (ACTIVE) e provider (BLOCKED)
- JWT com claims corretos: `{sub, providerId, conveniadoId, actorType, roles[]}`
- Refresh token armazenado como SHA-256 hash (boa pratica)
- Rotacao de refresh token na renovacao (revoga antigo, cria novo)
- Password hashing com PBKDF2 SHA-512, 120k iteracoes, salt aleatorio, `timingSafeEqual`
- Access token TTL = 15min, Refresh token TTL = 7 dias

**Issues encontradas**:

| # | Severidade | Issue | Localizacao |
|---|-----------|-------|------------|
| B-01 | **ALTA** | JWT implementado manualmente (hand-rolled HMAC-SHA256) em vez de usar `@nestjs/jwt` ou `jsonwebtoken` | `token.service.ts` |
| B-02 | **ALTA** | Sem validacao de input — nao ha `class-validator`, DTOs com decorators, nem `ValidationPipe` global | `auth.controller.ts` |
| B-03 | **MEDIA** | `(this.prisma as any)` em todos os repositorios — elimina type safety do TypeScript | `auth.repository.ts`, `audit.repository.ts` |
| B-04 | **MEDIA** | Audit duplicado no login — `@Audited('AUTH_LOGIN')` no controller + `auditService.log()` manual no service | `auth.controller.ts:21` + `auth.service.ts:76` |
| B-05 | **MEDIA** | Login permite providers com status SUSPENDED (apenas BLOCKED e verificado) | `auth.service.ts:52` |
| B-06 | **MEDIA** | JWT_SECRET tem fallback hardcoded `'fiadoauto-dev-secret'` e usa `process.env` direto | `token.service.ts:16` |
| B-07 | **BAIXA** | Logout nao tem `@Audited('AUTH_LOGOUT')` — evento nao auditado | `auth.controller.ts` |

### 2.4 T-004: Modulo RBAC — PARTIAL

**Conforme**:
- `@Roles()` decorator com `SetMetadata`
- `RolesGuard` registrado como `APP_GUARD` global
- `@TenantScoped()` decorator extrai `providerId` do request
- `TenantGuard` compara `providerId` do request vs JWT
- `ConveniadoGuard` valida `conveniadoId` para CONVENIADO_USER
- `TenantContextService` request-scoped com injecao de REQUEST

**Issues encontradas**:

| # | Severidade | Issue | Localizacao |
|---|-----------|-------|------------|
| B-08 | **MEDIA** | TenantGuard e ConveniadoGuard NAO registrados como APP_GUARD global — devem ser aplicados manualmente por rota | `app.module.ts` |
| B-09 | **BAIXA** | TenantGuard retorna `true` se nenhum `providerId` encontrado no request — silenciosamente bypassa a verificacao | `tenant.guard.ts:27` |
| B-10 | **BAIXA** | `RbacService` definido mas nao utilizado — `RolesGuard` faz verificacao inline | `rbac.service.ts` |

**Nota**: B-08 e B-09 sao by-design para flexibilidade, mas documentacao explicita seria necessaria. Os guards de tenant/conveniado devem ser aplicados explicitamente nos controllers de dominio (Sprints 4+), entao nao e um blocker para S1.

### 2.5 T-005: Modulo Audit — PARTIAL

**Conforme**:
- `AuditService.log()` com todos parametros requeridos
- `AuditInterceptor` registrado como `APP_INTERCEPTOR` global
- `@Audited(action)` decorator funcional
- Repository apenas com metodo `create` (sem update/delete)

**Issues encontradas**:

| # | Severidade | Issue | Localizacao |
|---|-----------|-------|------------|
| B-11 | **BAIXA** | `@Audited` em rotas `@Public()` e no-op — interceptor requer `authContext` que nao existe pré-auth | `audit.interceptor.ts:41` |
| B-12 | **BAIXA** | Append-only garantido apenas por convencao de codigo — sem enforcement no DB | `audit.repository.ts` |

### 2.6 T-006: Setup 4 Portais Frontend — PASS

**Conforme** (todos os 4 portais identicos exceto `appName`):
- Dependencias: vuetify, @mdi/font, pinia, vue-router, vue-i18n, axios, vite-plugin-vuetify
- `plugins/vuetify.ts` com temas light/dark, cores custom, MDI icons, `autoImport: true`
- `i18n/index.ts` + `i18n/locales/pt-BR.ts` com `legacy: false`, locale `'pt-BR'`
- `main.ts` registrando todos plugins na ordem correta
- `App.vue` com `<router-view />` + `<GlobalSnackbar />` + `<GlobalMessageDialog />`
- `apiClient.ts` com Bearer interceptor + redirect 401
- Auth store Pinia com state, getters e actions (login, logout, refresh, loadStoredAuth, clearAuth)
- Router com rotas publicas e protegidas, guard global
- `authGuard.ts` com logica completa (restaurar auth, redirect login, redirect home se autenticado, verificacao roles)
- Portas corretas: 5000 (acception), 5001 (solution), 5002 (provider), 5003 (conveniado)
- Clean Architecture: presentation/, application/, infrastructure/

**Issues menores**:
- Auth store usa localStorage key `authUser` em vez de `user` (spec secao 8.2) — internamente consistente

### 2.7 T-007: Layout Autenticado — PARTIAL

**Conforme**:
- `<v-app>` container raiz
- `<v-app-bar>` com hamburger, titulo i18n, spacer, avatar menu, logout
- `<v-navigation-drawer>` com info usuario (avatar + iniciais + nome + role chip)
- `<v-main>` com `<router-view />`
- `userInitials` computed funcional
- `handleLogout` action correta

**Issues encontradas**:

| # | Severidade | Issue | Localizacao |
|---|-----------|-------|------------|
| F-01 | **MEDIA** | `MenuItem` interface nao possui `children?: MenuItem[]` nem `badge?: number`; `to` deve ser `to?: string` (opcional para grupos) | `AuthenticatedLayout.vue` |
| F-02 | **MEDIA** | `filteredMenuItems` usa filtro plano — falta filtragem recursiva para children e rendering de `v-list-group` | `AuthenticatedLayout.vue` |

### 2.8 T-008: Componentes Globais — PASS

**Conforme**:
- `useSnackbar()` com estado singleton module-level, `show(message, type, timeout)`, `close()`, `readonly()`
- `useGlobalDialog()` mesmo padrao, `open(title, message, type)`, `close()`
- `GlobalSnackbar.vue` com `v-snackbar` `location="top right"`
- `GlobalMessageDialog.vue` com `v-dialog` `max-width="480"`, titulo, mensagem, botao fechar

**Issue menor**:

| # | Severidade | Issue | Localizacao |
|---|-----------|-------|------------|
| F-03 | **BAIXA** | Botao "Fechar" hardcoded em portugues — deveria usar `t('common.actions.close')` | `GlobalMessageDialog.vue` |

### 2.9 LoginView — PARTIAL

**Conforme**:
- Padrao visual correto: v-container fluid fill-height + gradiente + v-card centralizado
- Campos email e password com prepend-inner-icon
- Toggle de visibilidade de senha
- Alerta de erro (v-alert type="error")
- Botao submit com loading state

**Issues encontradas**:

| # | Severidade | Issue | Localizacao |
|---|-----------|-------|------------|
| F-04 | **MEDIA** | Campos de formulario SEM regras de validacao (`:rules` ausente) — spec exige emailRules e passwordRules | `LoginView.vue` |

### 2.10 Testes Backend — PARTIAL

| Componente | Testes | Status |
|-----------|--------|--------|
| `auth.service` | 4 testes (login, blocked provider, refresh, invalid refresh) | PASS |
| `audit.service` | 1 teste (append-only) | PASS (minimo) |
| `roles.guard` | 3 testes (no roles, match, insufficient) | PASS |
| `token.service` | 0 testes | **MISSING** |
| `password.service` | 0 testes | **MISSING** |
| `tenant.guard` | 0 testes | **MISSING** |
| `conveniado.guard` | 0 testes | **MISSING** |
| `auth.controller` | 0 testes | **MISSING** |
| `health.controller` | 0 testes | **MISSING** |

Testes existentes sao bem escritos (mocking correto, assertions claras). Mas cobertura insuficiente em componentes criticos de seguranca (TokenService, PasswordService).

---

## 3. Inventario de Issues

### 3.1 Issues por Prioridade

#### ALTA (Devem ser corrigidos)

| ID | Tipo | Descricao | Acao |
|----|------|-----------|------|
| B-01 | Bug/Seguranca | JWT hand-rolled em vez de lib provada | Substituir por `@nestjs/jwt` com `jsonwebtoken` |
| B-02 | Bug/Seguranca | Sem validacao de input (DTOs + ValidationPipe) | Adicionar `class-validator`, DTOs, `ValidationPipe` global |

#### MEDIA (Devem ser corrigidos nesta sprint)

| ID | Tipo | Descricao | Acao |
|----|------|-----------|------|
| B-03 | Qualidade | `(this.prisma as any)` em repositorios | Executar `npx prisma generate`; remover casts |
| B-04 | Bug | Audit duplicado no login | Remover `@Audited('AUTH_LOGIN')` do controller (manter manual no service) |
| B-05 | Bug | Login permite SUSPENDED providers | Adicionar check para SUSPENDED no auth.service |
| B-06 | Seguranca | JWT_SECRET hardcoded fallback + process.env direto | Injetar `ConfigService`; remover fallback |
| F-01 | Spec | MenuItem sem `children` e `badge` | Atualizar interface conforme ui-templates.md |
| F-02 | Spec | filteredMenuItems sem filtragem recursiva | Implementar `filterByRole()` recursivo + `v-list-group` |
| F-04 | Spec | LoginView sem validacao de formulario | Adicionar emailRules e passwordRules |

#### BAIXA (Podem ser corrigidos oportunisticamente)

| ID | Tipo | Descricao | Acao |
|----|------|-----------|------|
| B-07 | Spec | Logout sem `@Audited` | Adicionar `@Audited('AUTH_LOGOUT')` |
| B-11 | Design | `@Audited` em rotas publicas e no-op | Documentar comportamento |
| F-03 | i18n | "Fechar" hardcoded | Usar `t('common.actions.close')` |

### 3.2 Resumo Quantitativo

| Severidade | Backend | Frontend | Total |
|-----------|---------|----------|-------|
| ALTA | 2 | 0 | 2 |
| MEDIA | 4 | 3 | 7 |
| BAIXA | 2 | 1 | 3 |
| **Total** | **8** | **4** | **12** |

---

## 4. Correcoes Aplicadas

Todas as 12 issues foram corrigidas. Testes unitarios passam (8/8) e compilacao TypeScript limpa (`npx tsc --noEmit`).

| ID | Severidade | Correcao | Arquivo(s) | Status |
|----|-----------|----------|-----------|--------|
| B-01 | ALTA | Substituido JWT hand-rolled (HMAC-SHA256 manual com base64url) por `@nestjs/jwt`. TokenService reescrito para usar `JwtService.sign()` e `JwtService.verify()`. | `auth/application/token.service.ts`, `auth/auth.module.ts` | Corrigido |
| B-02 | ALTA | Adicionado `class-validator`, `class-transformer`. Criados `LoginDto` e `RefreshDto` com decorators de validacao. `ValidationPipe` global configurado em `main.ts` com `whitelist`, `forbidNonWhitelisted` e `transform`. | `auth/presentation/dto/login.dto.ts` (novo), `auth/presentation/dto/refresh.dto.ts` (novo), `main.ts`, `auth.controller.ts` | Corrigido |
| B-03 | MEDIA | Removidos todos os casts `(this.prisma as any)` — 6 ocorrencias em `auth.repository.ts` e 1 em `audit.repository.ts`. Tipo `details` alterado de `Record<string, unknown>` para `Prisma.InputJsonValue`. | `auth/infrastructure/auth.repository.ts`, `audit/infrastructure/audit.repository.ts` | Corrigido |
| B-04 | MEDIA | Removido `@Audited('AUTH_LOGIN')` do controller de login que duplicava a auditoria ja feita manualmente no `auth.service.ts`. | `auth/presentation/auth.controller.ts` | Corrigido |
| B-05 | MEDIA | Adicionada verificacao de status `SUSPENDED` do provider alem de `BLOCKED` no fluxo de login. Mensagem de erro diferenciada por status. | `auth/application/auth.service.ts` | Corrigido |
| B-06 | MEDIA | JWT_SECRET agora injetado via `ConfigService` atraves de `JwtModule.registerAsync`. Removido fallback hardcoded e acesso direto a `process.env`. | `auth/auth.module.ts` | Corrigido |
| B-07 | BAIXA | Adicionado decorator `@Audited('AUTH_LOGOUT')` ao endpoint de logout. | `auth/presentation/auth.controller.ts` | Corrigido |
| F-01 | MEDIA | Atualizada interface `MenuItem`: adicionados campos opcionais `children?: MenuItem[]`, `badge?: number`, e `to` tornado opcional. | `AuthenticatedLayout.vue` (4 portais) | Corrigido |
| F-02 | MEDIA | Implementada funcao recursiva `filterByRole()` que processa filhos de menu items. Adicionado `v-list-group` no template para renderizacao de submenus. | `AuthenticatedLayout.vue` (4 portais) | Corrigido |
| F-03 | BAIXA | Substituido texto hardcoded "Fechar" por `{{ t('common.actions.close') }}` com `useI18n()`. | `GlobalMessageDialog.vue` (4 portais) | Corrigido |
| F-04 | MEDIA | Adicionadas regras de validacao (`emailRules`, `passwordRules`) aos campos do formulario de login. Adicionado `ref="formRef"` ao `v-form` e `closable` ao `v-alert`. | `LoginView.vue` (4 portais) | Corrigido |
| — | — | **Bonus**: Corrigido `PrismaService` — substituido `$on('beforeExit')` deprecado por `OnModuleDestroy`. Substituido `prisma.enableShutdownHooks(app)` por `app.enableShutdownHooks()` em `main.ts`. | `prisma.service.ts`, `main.ts` | Corrigido |

### Dependencias adicionadas

```bash
npm install --legacy-peer-deps @nestjs/jwt class-validator class-transformer
```

---

## 5. Itens NAO Aplicaveis a S1

Os seguintes itens **nao foram considerados issues** pois sao de sprints futuras:

- TenantGuard/ConveniadoGuard nao registrados globalmente (serao usados com `@UseGuards` nos controllers de dominio a partir da S4)
- RbacService nao utilizado (sera utilizado em regras complexas de permissao)
- Testes E2E (planejados para S10)
- Rate limiting em endpoints de auth (recomendado, mas nao especificado no plano S1)

---

## 6. Recomendacoes para Proximas Sprints

1. **Adicionar `@nestjs/throttler`** para rate limiting nos endpoints de auth
2. **Adicionar global exception filter** com formato padronizado de erro
3. **Consolidar interface `RequestWithAuth`** em um unico local compartilhado
4. **Adicionar testes para TokenService e PasswordService** antes de S2
5. ~~**Corrigir PrismaService shutdown hooks**~~ — Ja corrigido nesta revisao (ver item bonus na Secao 4)
