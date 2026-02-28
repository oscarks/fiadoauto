# FiadoAuto

Plataforma SaaS Provider-First para gestão de crédito (fiado), antifraude e controle de frota.

Postos de combustível e oficinas concedem crédito próprio a empresas conveniadas, com governança financeira, ledger auditável e antifraude determinístico (Fase 1) + IA (Fase 2+).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11 · Prisma 7 · PostgreSQL · TypeScript |
| Frontend | Vue 3 · Vuetify 4 · Pinia · Vite 7 · TypeScript |
| IA Service | Python 3.10+ · FastAPI · Uvicorn · UV |
| Mobile | Flutter (planejado) |

## Estrutura

```
backend/server-api/          API NestJS (monólito modular, Clean Architecture)
frontend/portal-acception/   Admin SaaS
frontend/portal-solution/    Portal público + registro provider
frontend/portal-provider/    Portal do posto/oficina (white-label)
frontend/portal-conveniado/  Portal da empresa conveniada (white-label)
services/ia-service/         Serviço de IA (Python/FastAPI)
mobile/app-frentista/        App frentista (Flutter)
mobile/app-mecanico/         App mecânico (Flutter)
packages/shared-types/       Tipos TypeScript compartilhados
packages/ui-components/      Componentes Vue compartilhados
packages/utils/              Utilitários compartilhados
docs/                        Documentação (specs, ADRs, features)
```

## Portas

| Aplicação | Porta |
|-----------|-------|
| server-api | 5100 |
| portal-acception | 5000 |
| portal-solution | 5001 |
| portal-provider | 5002 |
| portal-conveniado | 5003 |
| ia-service | 5010 |

Portas configuráveis via `.env` de cada aplicação.

## Setup

### Pré-requisitos

- Node.js 24+
- npm
- Python 3.10+
- [UV](https://docs.astral.sh/uv/) (gerenciador Python)
- PostgreSQL

### Backend

```bash
cd backend/server-api
npm install
cp .env .env.local  # ajustar DATABASE_URL
npx prisma generate
npm run start:dev
```

### Frontend (cada portal)

```bash
cd frontend/portal-solution  # ou portal-provider, portal-conveniado, portal-acception
npm install
npm run dev
```

### IA Service

```bash
cd services/ia-service
uv sync
uv run uvicorn main:app --reload --port 5010
```

## Documentação

- [Produto e Roadmap](docs/Overview/Product.md)
- [Arquitetura](docs/Architecture/Architecture%20Overview.md)
- [ADRs](docs/Architecture/ADR/)
- [Features](docs/Features/)
- [Glossário](docs/Overview/Glossary.md)
- [Backlog](docs/Overview/Backlog.md)
