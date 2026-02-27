# CLAUDE.md — FiadoAuto

## O que é este projeto

Plataforma SaaS Provider-First para gestão de crédito (fiado), antifraude e controle de frota. Postos de combustível e oficinas concedem crédito próprio a empresas conveniadas, com governança, ledger auditável e antifraude.

## Arquitetura

- **Monorepo** com aplicações independentes (sem workspaces — cada app tem seu `node_modules`)
- **Backend**: monólito modular NestJS 11 + Prisma 7 + PostgreSQL, Clean Architecture
- **Frontends**: 4 portais Vue 3 + Vuetify 4 + Pinia + Vue Router
- **IA Service**: Python 3.10+ / FastAPI / Uvicorn (stateless, Fase 2+)
- **Mobile**: Flutter (app-frentista, app-mecanico) — placeholder
- **Packages**: shared-types, ui-components, utils (TypeScript)

## Estrutura de diretórios

```
backend/server-api/         NestJS API (porta 5100)
frontend/portal-acception/  Admin SaaS (porta 5000)
frontend/portal-solution/   Portal público (porta 5001)
frontend/portal-provider/   Portal do posto/oficina (porta 5002)
frontend/portal-conveniado/ Portal da empresa (porta 5003)
services/ia-service/        IA Python/FastAPI (porta 5010)
mobile/app-frentista/       App frentista (Flutter)
mobile/app-mecanico/        App mecânico (Flutter)
packages/shared-types/      Tipos TypeScript compartilhados
packages/ui-components/     Componentes Vue compartilhados
packages/utils/             Utilitários compartilhados
docs/                       Documentação (specs, ADRs, features)
```

## Multitenancy

- **Provider = tenant real** (isolamento por `provider_id` em todas as tabelas)
- **Empresa conveniada = escopo** dentro do provider (`conveniado_id`)
- Sem RLS — isolamento via RBAC + scoping obrigatório + guards no backend

## Clean Architecture (backend)

Cada módulo NestJS segue 4 camadas em `src/modules/<nome>/`:

- `presentation/` — controllers, DTOs, guards, pipes
- `application/` — use cases, serviços de orquestração
- `domain/` — entidades, value objects, regras de negócio
- `infrastructure/` — repositórios Prisma, adapters externos

## Módulos NestJS (24 módulos)

**Core**: auth, tenancy, rbac, audit, i18n
**Domínio Provider**: providers, conveniados, plans-provider, fleet, catalog, credit, ledger, policy-engine, refuel, billing-provider, notifications, evidence
**SaaS**: portal-solution, billing-saas, admin-acception
**Integrações**: payment-gateway, ai-client, storage, observability

## Comandos por aplicação

### Backend (backend/server-api/)
```bash
npm run start:dev       # dev com watch
npm run start:debug     # debug com watch (porta 9229)
npm run build           # nest build
npm run test            # jest
npm run test:e2e        # jest e2e
npm run lint            # eslint --fix
npx prisma migrate dev  # rodar migrations
npx prisma generate     # gerar client
```

### Frontend (frontend/portal-*/)
```bash
npm run dev       # vite dev server (porta configurável via VITE_PORT no .env)
npm run build     # vue-tsc -b && vite build
npm run preview   # vite preview
```

### IA Service (services/ia-service/)
```bash
uv run uvicorn main:app --reload --port 5010   # dev server
uv run python main.py                           # via __main__
uv add <pacote>                                 # adicionar dependência
```

### Packages (packages/*/)
```bash
npm run build   # tsc (shared-types, utils) ou vue-tsc && vite build (ui-components)
npm run dev     # watch mode
```

## Stack e versões

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11, TypeScript 5.7, Prisma 7, PostgreSQL |
| Frontend | Vue 3, Vuetify 4, Vite 7, Pinia, TypeScript 5.9 |
| IA Service | Python 3.10+, FastAPI, Uvicorn, UV (gerenciador) |
| Mobile | Flutter (planejado) |
| Testes | Jest 30 (backend), vue-tsc (frontends) |
| Lint | ESLint 9 + Prettier 3.4 |

## Configuração de portas (.env de cada app)

| App | Variável | Porta |
|-----|----------|-------|
| server-api | `PORT` | 5100 |
| portal-acception | `VITE_PORT` | 5000 |
| portal-solution | `VITE_PORT` | 5001 |
| portal-provider | `VITE_PORT` | 5002 |
| portal-conveniado | `VITE_PORT` | 5003 |
| ia-service | `PORT` | 5010 |

## Banco de dados

- PostgreSQL, connection string em `backend/server-api/.env` (`DATABASE_URL`)
- Prisma schema em `backend/server-api/prisma/schema.prisma` (models a serem criados conforme features)
- Config em `backend/server-api/prisma.config.ts`

## Documentação

- `/docs/Overview/Product.md` — definição do produto, fases, roadmap
- `/docs/Architecture/Architecture Overview.md` — arquitetura macro, diagramas, módulos
- `/docs/Architecture/ADR/` — 11 ADRs (decisões arquiteturais)
- `/docs/Features/` — specs de features (Multitenancy, SaaS, Antifraude, etc.)
- `/docs/Overview/Glossary.md` — glossário de termos
- `/docs/Overview/Modules.md` — descrição detalhada dos módulos
- `/docs/Overview/Backlog.md` — backlog e priorização

## Fases do projeto

1. **Fase 1 — Postos**: multitenancy, crédito, ledger, antifraude determinístico, app frentista, billing
2. **Fase 2 — IA**: score crédito (assíncrono), fraude transacional (síncrono leve), limite dinâmico
3. **Fase 3 — Oficinas**: OS integrada ao crédito, app mecânico, IA para OS
4. **Fase 4 — Parcerias**: limite compartilhado, liquidação inter-provider

## Princípios de desenvolvimento

- **Spec Driven Development (SDD)**: documentação como fonte de contexto para IA e humanos
- Cada feature deve ter: contexto, objetivo, casos de uso, regras de negócio, modelos, APIs, diagramas (PlantUML/Mermaid), critérios de aceite
- Diagramas em PlantUML ou Mermaid
- Ledger append-only (nunca alterar/deletar entries)
- Autorização P95 ≤ 300ms
- IA stateless com timeout curto e fallback determinístico
