Análise de **multitenancy em múltiplos níveis** (Provider e Empresa dentro do Provider), com **opções arquiteturais**, **prós/cons** e uma **recomendação** alinhada ao seu cenário (SMB, white-label, muitos tenants, ledger/auditoria, NestJS+Prisma+Postgres).

---

# 1) O que significa “multitenancy em múltiplos níveis”

Você tem, na prática, dois “domínios de isolamento”:

## Nível 1 — Provider (posto/oficina)

* É o **tenant principal** do SaaS (o que paga a Acception, tem branding white-label, políticas, usuários operadores).
* Requisito: **isolamento forte** entre providers.

## Nível 2 — Empresa conveniada (dentro do provider)

* Não é “tenant do SaaS” (não paga a Acception), mas é um **subdomínio com usuários próprios**, dados próprios (veículos, motoristas, centros de custo, faturas, extratos) e permissões.
* Requisito: **isolamento lógico forte** entre empresas *dentro do mesmo provider* (sobretudo para usuários do conveniado), sem virar um “novo tenant de infraestrutura”.

Ou seja: **Tenant (Provider)** + **Organização/Sub-tenant (Conveniado)**.

---

# 2) Arquitetura para o Nível 1 (Provider)

## Shared DB + Shared Schema + `provider_id` em todas as tabelas

**Como funciona**

* Um único banco Postgres.
* Todas as tabelas multi-tenant têm coluna `provider_id` (ou `tenant_id`).
* Toda query é sempre filtrada por `provider_id`.
* Índices compostos incluem `provider_id`.

**Prós**

* Menor custo operacional e maior simplicidade (Prisma gosta disso).
* Excelente para milhares de tenants pequenos (SMB).
* Migração e deploy simples.

**Contras**

* Risco humano: “esquecer o filtro” em algum ponto (mitigável).
* Isolamento depende de disciplina de código + testes + (idealmente) RLS.

**Quando é ideal**

* Seu caso, especialmente no início.

---

# 3) Arquitetura para o Nível 2 (Empresa dentro do Provider)

Aqui existem duas formas de enxergar “empresa”:

## Empresa é apenas uma entidade de negócio (`company_id`) dentro do provider

**Como funciona**

* Tudo pertence ao provider.
* Empresa é uma entidade: `conveniado_id`.
* Usuários do conveniado são usuários do *mesmo* tenant provider, porém com um papel “CONVENIADO_USER” e **escopo de empresa**.

**Prós**

* Simples e escalável.
* Evita “tenancy explosivo”.
* Mantém todo o ledger e políticas no provider (correto para provider-first).
* Funciona bem com “apenas 1 plano ativo por convênio” e políticas por convênio.

**Contras**

* Você precisa projetar muito bem **RBAC com escopo** (empresa).
* Em queries, além de `provider_id`, usuários do conveniado precisam sempre de `conveniado_id`.

**Quando é ideal**

* Seu caso. Empresa não é “tenant SaaS”, é “subdomínio” sob o provider.


---

# 4) Como implementar (recomendação final): “Tenancy hierárquica no AUTHZ, não no DB”

## 4.1 Modelo de contexto (sempre presente)

Toda requisição terá um `TenantContext`:

* `providerId` (sempre)
* `actorType` = PROVIDER_USER | CONVENIADO_USER | ACCECTION_ADMIN
* `conveniadoId` (apenas quando actorType=CONVENIADO_USER)
* `roles[]` e `permissions[]`

### Regras de ouro

* **Provider user**: vê tudo do provider, inclusive todas empresas.
* **Conveniado user**: vê somente dados com `providerId` + `conveniadoId` dele.
* **Acception admin**: vê múltiplos providers (com trilha de auditoria e “impersonation controlada”).

---

## 4.2 Padrão de dados (colunas obrigatórias)

* Todas as tabelas de negócio: `provider_id` **obrigatório**
* Entidades “da empresa”: `conveniado_id` **obrigatório** (ex.: vehicles, drivers, invoices, ledger_entries, refuel_transactions, cost_centers)
* Entidades “só do provider”: sem `conveniado_id` (ex.: price_list, provider_settings)
* Entidades “cross-company” (raras) devem ser projetadas com cuidado.

**Índices recomendados**

* `INDEX(provider_id, conveniado_id, created_at)`
* Unique idempotência: `UNIQUE(provider_id, external_tx_id)`

---

## 4.3 Enforcement no backend (Clean Architecture)

* Um **TenantGuard** (NestJS) resolve o contexto e injeta no request scope.
* Um **Policy de acesso** por caso de uso (application layer) que:

  * valida `provider_id` sempre
  * valida `conveniado_id` quando actor for conveniado
* Repositórios recebem `TenantContext` e **não permitem query sem providerId** (fail-fast).

> “Esquecer filtro” vira impossível por design: seus métodos exigem `providerId` como argumento obrigatório.

---

# 5) Reforço opcional: Postgres Row Level Security (RLS)

## Como seria

* Ativar RLS nas tabelas críticas (ledger, refuel, invoices, etc.).
* No início de cada request, setar variáveis de sessão:

  * `app.provider_id`
  * `app.conveniado_id`
  * `app.actor_type`
* Policies:

  * provider user: `provider_id = current_setting('app.provider_id')`
  * conveniado user: `provider_id = ... AND conveniado_id = current_setting('app.conveniado_id')`

## Prós

* Segurança “no banco”: mesmo se alguém errar query, não vaza.
* Excelente para requisitos de segurança e LGPD.

## Contras

* Aumenta complexidade de setup.
* Com Prisma, exige disciplina para configurar a sessão/transaction corretamente por request (mas é viável).

### Recomendação pragmática

* **Fase 1**: enforcement forte no backend + testes + code patterns.
* **Fase 2/3**: adicionar RLS nas tabelas mais sensíveis (ledger/transactions/evidence) se o risco exigir.

---

# 6) White-label e multitenancy (domínios)

* Tabela `provider_domains`:

  * `provider_id`
  * `domain`
  * `status` + `verified_at`
* O gateway (Nginx/Traefik) encaminha e o backend resolve `providerId` pelo host.
* Isso é orthogonal ao Nível 2 (empresa): empresa entra por login/claims.

---

# 7) Resumo de decisão recomendada

✅ **Provider = Tenant real** (SaaS)
✅ **Empresa = subdomínio/escopo (conveniado)** dentro do tenant provider
✅ **Isolamento**:

* DB: `provider_id` em tudo + `conveniado_id` onde aplicável
* App: RBAC + scoping obrigatório
* (opcional) DB: RLS nas tabelas críticas

Isso equilibra:

* segurança
* custo operacional
* compatibilidade com Prisma
* roadmap (oficinas, parcerias, IA)
