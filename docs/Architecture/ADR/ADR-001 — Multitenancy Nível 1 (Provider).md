

* **Status:** Aceito
* **Data:** 2026-02-18
* **Decisores:** Acception (Produto/Arquitetura)
* **Escopo:** Nível 1 de multitenancy (Provider = posto/oficina) no backend NestJS + Prisma + PostgreSQL
* **Fases impactadas:** Fase 1–4

---

## Contexto

A solução é um SaaS provider-first voltado a **postos e oficinas SMB**, com múltiplos portais/apps, white-label, ledger/auditoria e evolução para IA. O sistema precisa suportar **muitos providers pequenos**, com baixo custo operacional e boa escalabilidade.

Requisitos relevantes:

* **Isolamento forte entre providers** (dados e acesso).
* **Baixo custo operacional** (deploy/migrações simples).
* Compatibilidade com **NestJS + Prisma + PostgreSQL**.
* Suporte a **white-label** (mapeamento de domínio → provider).
* Evolução para fases com maior complexidade (oficinas e parcerias).

---

## Decisão

Adotar **Opção A** para multitenancy no Nível 1 (Provider):

> **Shared Database + Shared Schema**, com **coluna `provider_id` (tenant_id)** em todas as tabelas multi-tenant, e **todas as queries obrigatoriamente filtradas por `provider_id`**.

Além disso, estabelecer padrões arquiteturais para minimizar risco de vazamento:

* `provider_id` como **campo obrigatório** em entidades multi-tenant.
* índices compostos iniciando por `provider_id`.
* idempotência e unicidade por `provider_id` quando aplicável (ex.: `(provider_id, external_tx_id)`).
* enforcement no backend (guards + repositórios) para impedir consultas sem `provider_id`.
* trilha de auditoria com `provider_id` em todos eventos relevantes.

---

## Opções consideradas

### Opção A — Shared DB + Shared Schema + `provider_id` (DECIDIDA)

**Descrição:** Um único banco e schema; todas as entidades multi-tenant possuem `provider_id` e acesso é controlado por filtro e autorização.

### Opção B — Shared DB + Schema por Provider

**Descrição:** Um schema por provider no mesmo banco.

### Opção C — Banco por Provider

**Descrição:** Um banco (ou cluster isolado) por provider.

---

## Justificativa

A Opção A é a melhor para o cenário SMB e para o stack escolhido porque:

* Maximiza **simplicidade operacional** (migrações, deploy, backup).
* Escala bem para **muitos tenants pequenos**.
* Mantém compatibilidade e ergonomia com **Prisma**.
* Permite evolução incremental de segurança (ex.: introduzir RLS depois nas tabelas críticas) sem reestruturar o armazenamento.
* Facilita a centralização de analytics e monitoramento (incluindo risco/fraude e IA).

---

## Consequências

### Positivas

* **Menor custo** e complexidade de operação (um DB, um schema).
* **Migrações simples** e consistentes (um pipeline).
* **Boa escalabilidade** para grande número de providers SMB.
* **Integração natural** com portais/apps e com o modelo de white-label (domínio → provider).

### Negativas / Riscos

* Risco de **vazamento de dados** caso alguma query seja executada sem filtro por `provider_id`.
* Hardening de segurança depende de disciplina de implementação (guards, padrões, testes).
* Eventuais tenants grandes podem exigir estratégia premium (ex.: single-tenant futuro).

### Mitigações (obrigatórias)

1. **Enforcement no backend (fail-fast)**

   * Todo caso de uso recebe `ProviderContext { providerId, actor, roles… }`.
   * Repositórios exigem `providerId` como parâmetro obrigatório.
   * Proibir métodos “genéricos” de listagem sem scoping.

2. **Índices e constraints**

   * Índices compostos iniciando por `provider_id` em tabelas de alto volume (`refuel_transactions`, `ledger_entries`, `invoices`).
   * Unique: `(provider_id, external_tx_id)` para idempotência (abastecimento).

3. **Auditoria**

   * `provider_id` presente em `audit_log`, `authorization_decisions`, `ledger_entries`.
   * Registro de `policy_version` e `rule_hits` em decisões.

4. **Testes de isolamento**

   * Suite automatizada garantindo que um provider nunca lê/escreve dados de outro.
   * Testes de API com tokens de providers distintos.

5. **Hardening futuro (opcional por fase)**

   * Avaliar habilitar **PostgreSQL Row Level Security (RLS)** nas tabelas críticas (ledger/transactions/evidence) a partir da Fase 2/3, caso necessário.

---

## Implicações de implementação (normas)

* Toda tabela multi-tenant deve conter:

  * `provider_id` (NOT NULL) e FK para `providers/tenants`.
* Toda PK lógica ou chave natural deve ser composta quando relevante:

  * exemplo: `unique(provider_id, plate)` para veículos por provider.
* Toda rota deve determinar `providerId` por:

  * token (claims) e/ou
  * domínio (white-label) resolvido no gateway/API.
* Logs, métricas e eventos devem incluir `provider_id` como label/chave.

---

## Critérios de aceitação

* Nenhum endpoint retorna dados de outro provider com tokens válidos de tenant diferente.
* Todas as tabelas definidas como multi-tenant possuem `provider_id` obrigatório.
* Consultas principais usam índices compostos com `provider_id`.
* Autorização de abastecimento implementa idempotência `(provider_id, external_tx_id)`.
* Auditoria registra `provider_id` e motivos (reason codes) para decisões.

---

## Referências internas

* Decisão de arquitetura: NestJS + Prisma + PostgreSQL; provider-first; white-label; ledger/auditoria; antifraude determinístico no backend; IA separada em Python/FastAPI (fases posteriores).
