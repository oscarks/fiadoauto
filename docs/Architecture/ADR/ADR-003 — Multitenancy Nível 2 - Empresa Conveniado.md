

- **Status:** Aceito    
- **Data:** 2026-02-18
- **Decisores:** Acception (Produto/Arquitetura)
- **Escopo:** Nível 2 de multitenancy: **Empresa/Conveniado** dentro de um **Provider (tenant)**
- **Fases impactadas:** Fase 1–4 (principalmente Fase 1–3)

---

## Contexto

O produto é **provider-first**: o **provider (posto/oficina)** é o dono do relacionamento e do crédito, e gerencia empresas conveniadas (CNPJ) e sua carteira (limites, cobrança, inadimplência). Dentro de um mesmo provider existirão múltiplas empresas com seus próprios usuários, veículos, motoristas, centros de custo e dados financeiros (extratos, faturas, consumo).

Requisitos relevantes:

- Manter **isolamento forte** entre empresas quando usuários do conveniado acessam o sistema (não podem ver dados de outras empresas do mesmo provider).
- Não transformar empresas em “tenants SaaS” (não pagam a Acception e não devem herdar complexidade de billing/white-label).
- Preservar coerência com o modelo de crédito: **o credor é o provider**.
- Escalar para muitas empresas por provider (SMB).
- Compatível com NestJS + Prisma + PostgreSQL, e com a decisão do ADR-001 (Provider como tenant).
    

---

## Decisão

Adotar **Opção 1** para Nível 2:

> **Empresa (Conveniado) será uma entidade de negócio (`conveniado_id`) dentro do tenant Provider**, não um tenant separado.  
> O isolamento no Nível 2 será garantido por **autorização (RBAC + scoping)** e por **modelagem de dados** com `conveniado_id` obrigatório nas entidades pertencentes ao conveniado.

Assim:

- O contexto de requisição sempre contém `providerId`.
- Para usuários do conveniado, o contexto também contém `conveniadoId`.
- Queries de conveniado exigem filtros por **`provider_id` + `conveniado_id`**.

---

## Opções consideradas

### Opção 1 — Empresa como entidade (`conveniado_id`) dentro do Provider (DECIDIDA)

**Descrição:** Empresas não são tenants. Elas existem sob o provider; usuários do conveniado possuem escopo limitado por `conveniado_id`.

### Opção 2 — Empresa como “sub-tenant formal” (tenant hierárquico)

**Descrição:** Empresas seriam tenants filhos (ex.: `tenants.parent_tenant_id = provider_tenant_id`), com isolamento “nativo” por tenant.

---

## Justificativa

A Opção 1 é a melhor para o desenho provider-first e para o roadmap porque:

- Mantém **responsabilidades claras**: provider é o credor e operador do crédito; empresa é cliente.
- Evita explosão de tenancy e complexidade de billing/white-label por empresa.
- Simplifica o domínio de crédito/ledger/cobrança, que é naturalmente **centrado no provider**.
- Escala melhor operacionalmente e é mais simples com Prisma e schema compartilhado.
- Facilita aplicar “apenas 1 plano ativo por convênio” e políticas por convênio sem herança complexa de tenant.

---

## Consequências

### Positivas

- Menor complexidade de dados, billing e configuração.
- Modelo consistente com “provider controla limites e cobrança”.
- Escala bem para muitos conveniados por provider.
- Permite evoluir para oficinas (Fase 3) sem remodelar tenancy.

### Negativas / Riscos

- Risco de vazamento entre empresas do mesmo provider se o scoping por `conveniado_id` for aplicado incorretamente.
- Necessidade de um modelo de autorização mais sofisticado (RBAC com escopo).
- Alguns relatórios “do provider” precisam ser explicitamente “cross-company” (intencional).

### Mitigações (obrigatórias)

1. **Contexto de Tenancy e Escopo**
    - Sempre resolver `providerId`.
    - Se `actorType = CONVENIADO_USER`, exigir `conveniadoId` no token/claims.
    - Caso ausente/inválido → negar acesso.
2. **Padrões de repositório (fail-fast)**
    - Repositórios de entidades de conveniado exigem `providerId` e `conveniadoId`.
    - Proibir métodos sem escopo para conveniado.
3. **Modelagem de dados**
    - Entidades “do conveniado” devem ter `conveniado_id` **NOT NULL** (ex.: vehicles, drivers, cost_centers, invoices, ledger_entries, refuel_transactions).
    - Entidades “do provider” não carregam `conveniado_id` (ex.: price_list, provider_settings).
    - Índices compostos por `(provider_id, conveniado_id, created_at)` para tabelas de alto volume.
4. **Testes automatizados de isolamento intra-provider**
    - Tokens de empresas diferentes no mesmo provider não podem acessar dados cruzados.
    - Testes de listagem, busca por ID e exportações.
5. **Auditoria**
    - Logar `provider_id` e, quando aplicável, `conveniado_id` em eventos críticos.
    - Registrar ações sensíveis (alteração de limites, bloqueios, pagamentos).
6. **Hardening opcional (futuro)**
    - Considerar RLS em tabelas sensíveis com política baseada em `provider_id` e `conveniado_id` caso o risco/escala exija.

---

## Implicações de implementação (normas)

- **AuthN/AuthZ**
    - `actorType`: `PROVIDER_USER` | `CONVENIADO_USER` | `ACCEPTION_ADMIN`
    - `PROVIDER_USER`: acesso a todas as empresas do provider.
    - `CONVENIADO_USER`: acesso somente ao `conveniadoId` associado.
- **Token/claims**
    - `provider_id` obrigatório para todos.
    - `conveniado_id` obrigatório para `CONVENIADO_USER`.
- **Queries**
    - Conveniado: sempre `WHERE provider_id = ? AND conveniado_id = ?`
    - Provider: `WHERE provider_id = ?` (sem `conveniado_id`) quando visão agregada for intencional.
- **Entidades cross-company**
    - Devem ser explicitamente modeladas e revisadas (ex.: relatórios agregados do provider, políticas globais, templates).

---

## Critérios de aceitação

- Um usuário do conveniado não consegue
    - listar, buscar ou exportar dados de outro conveniado do mesmo provider.
- Todas as entidades do conveniado têm `conveniado_id` obrigatório e filtragem dupla.
- Todas as rotas do portal do conveniado exigem token com `conveniado_id`.
- Auditoria registra `conveniado_id` quando aplicável.
- Testes de isolamento intra-provider passam em CI.

---

## Referências internas

- ADR-001: Multitenancy Nível 1 (Provider) com shared schema + `provider_id`.
- Decisões de produto: provider-first, 1 plano ativo por convênio, cobrança automática via gateway como add-on do provider, contrato default templated, renegociação parcelada em fase posterior.