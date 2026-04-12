# CLAUDE.md — FiadoAuto

## Projeto

Plataforma SaaS Provider-First para Gestão de Crédito (Fiado), Antifraude e Controle de Frota.
Público-alvo: postos de combustível e oficinas SMB. Provider é o tenant (credor), empresa conveniada é escopo dentro do provider.

## Documentação

- **Produto**: `docs/Overview/Product.md`
- **Arquitetura**: `docs/Architecture/Architecture Overview.md`
- **ADRs**: `docs/Architecture/ADR/`
- **Features**: `docs/Features/`
- **Prompts de dev**: `docs/Prompts/`
- **Glossário**: `docs/Overview/Glossary.md`
- **Backlog**: `docs/Overview/Backlog.md`

Leia sempre os documentos relevantes antes de implementar. A documentação é fonte de verdade.

## Monorepo — Estrutura

```
backend/server-api/       → NestJS 11 + Prisma 7 + PostgreSQL (porta 5100)
frontend/portal-acception → Vue 3 + Vuetify + Pinia (porta 5000)
frontend/portal-solution  → Vue 3 + Vuetify + Pinia (porta 5001)
frontend/portal-provider  → Vue 3 + Vuetify + Pinia (porta 5002)
frontend/portal-conveniado→ Vue 3 + Vuetify + Pinia (porta 5003)
mobile/app-frentista      → Flutter
mobile/app-mecanico       → Flutter
services/ia-service       → Python 3.10+ / FastAPI / UV (porta 5010)
packages/shared-types     → TypeScript (tipos compartilhados)
packages/ui-components    → Vue 3 + Vuetify (componentes reutilizáveis)
packages/utils            → TypeScript (utilitários)
```

Cada aplicação Node tem seu próprio `node_modules` — não há workspace root.

## Arquitetura

### Princípios

- **Clean Architecture** obrigatória (Presentation → Application → Domain → Infrastructure)
- **Monólito modular** no backend (NestJS modules)
- **Multitenancy**: `provider_id` obrigatório em toda entidade; `conveniado_id` quando aplicável
- **Ledger append-only** com saldos materializados
- **IA stateless** separada (Python/FastAPI) — Fase 2+
- **Spec Driven Development**: documentação como contexto para IA e humanos

### Backend — Módulos NestJS (`backend/server-api/src/modules/`)

- **core/**: auth, tenancy, rbac, audit, i18n
- **domain/**: providers, conveniados, plans-provider, fleet, catalog, credit, ledger, policy-engine, refuel, billing-provider, notifications, evidence
- **saas/**: billing-saas, admin-acception, portal-solution
- **integrations/**: payment-gateway, ai-client, storage, observability

### Camadas do Backend (Clean Architecture)

- **Presentation**: Controllers, DTOs, Guards, Pipes (`common/`)
- **Application**: Use Cases, Services (orquestração, sem infra)
- **Domain**: Entidades, Value Objects, Regras, Políticas
- **Infrastructure**: Prisma repositories, adapters externos

## Regras de Desenvolvimento

### Gerais

- NÃO altere decisões arquiteturais existentes (ADRs)
- NÃO crie atalhos ou acoplamentos entre camadas
- NÃO misture camadas (controller ≠ service ≠ domain)
- Sempre considerar multi-tenancy (`provider_id` / `conveniado_id`)
- Se algo não estiver definido nos docs, PERGUNTE antes de assumir
- NÃO implemente funcionalidades fora da fase/sprint solicitada
- Verifique se já existe implementação antes de criar — evite duplicação

### Backend (NestJS + Prisma)

- Respeite a estrutura modular em `src/modules/{core,domain,saas,integrations}`
- Use `src/common/` para pipes, interceptors, decorators, filters, guards
- Prisma schema em `backend/server-api/prisma/schema.prisma`
- Testes: Jest (`*.spec.ts`)

### Frontend (Vue 3 + Vuetify + Pinia)

- NÃO criar mocks hardcoded
- Usar stores (Pinia) para estado
- Usar services/adapters para HTTP
- Clean Architecture no frontend também (Presentation / Application / Domain / Infrastructure)

### IA Service (Python + FastAPI)

- Respeite a arquitetura stateless
- UV como gerenciador de projeto
- Dev: `uvicorn app.main:app --reload --port 5010`

## Comandos

### Backend

```bash
cd backend/server-api
npm run start:dev          # Dev com watch
npm run start:debug        # Dev com debug
npm run test               # Testes unitários
npm run test:e2e           # Testes e2e
npm run lint               # ESLint
npx prisma generate        # Gerar client Prisma
npx prisma db push         # Aplicar schema ao DB
```

### Frontend (qualquer portal)

```bash
cd frontend/<portal>
npm run dev                # Dev server
npm run build              # Build produção
```

### IA Service

```bash
cd services/ia-service
uv run dev                 # Dev server (porta 5010)
```

## Fases do Projeto

- **Fase 1**: Postos — multitenancy, crédito, ledger, antifraude determinístico, app frentista
- **Fase 2**: IA — score crédito, fraude transacional, limite dinâmico
- **Fase 3**: Oficinas — OS integrada, app mecânico
- **Fase 4**: Parcerias — limite compartilhado, liquidação inter-provider

## Arquivos Ignorados

- `docs/Prompts/**` — NÃO leia, NÃO inclua no contexto. São prompts de uso humano, não destinados ao agente.

## Decisões-Chave

- Provider-first: provider é credor e dono do relacionamento
- Sem RLS inicial — isolamento via RBAC + scoping obrigatório + guards
- White-label a partir do plano Growth
- Gateway de pagamento como add-on
- App frentista online obrigatório
- Autorização P95 ≤ 300ms
- Idempotência por `(provider_id, external_tx_id)`
