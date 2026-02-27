Segue o **Glossário Oficial do Projeto** — objetivo: **padronizar termos, eliminar ambiguidades e servir como referência única** para humanos e agentes de IA no contexto de Spec Driven Development.

> Este documento deve ficar em:
> `docs/overview/glossary.md`

---

# 📘 Glossário Oficial — Plataforma Provider-First (Fiado, Crédito e Antifraude)

---

# 1️⃣ Conceitos Estratégicos

## Provider

Posto de combustível ou oficina que utiliza a plataforma para conceder crédito (fiado) a empresas.

* É o **tenant real do SaaS**
* Paga a assinatura para a Acception
* Define planos de convênio
* Define políticas de crédito e antifraude
* Pode usar white-label

---

## Conveniado (Empresa)

Empresa que possui convênio com um Provider para consumir produtos/serviços a crédito.

* Está dentro do escopo de um Provider
* Não é tenant do SaaS
* Possui veículos, motoristas e centros de custo
* Pode ter apenas **1 plano ativo** por vez

---

## Tenant

Entidade isolada no SaaS.
No projeto, **Tenant = Provider**.

---

## White-label

Capacidade do Provider utilizar a plataforma com:

* Subdomínio próprio (ex: posto.acpt.app)
* Domínio próprio (Plano Pro+)
* Logo, cores e identidade visual personalizada

---

## Acception

Empresa proprietária da plataforma SaaS.

* Opera Billing SaaS
* Gerencia tenants
* Mantém infraestrutura

---

# 2️⃣ Conceitos Financeiros

## Crédito (Fiado)

Limite financeiro concedido pelo Provider ao Conveniado para consumo futuro com pagamento posterior.

---

## Limite de Crédito

Valor máximo permitido para consumo acumulado antes do pagamento.

Pode existir:

* Limite global por convênio
* Limite por veículo
* Limite por período (dia/semana/mês)

---

## Ledger

Livro-razão financeiro **append-only** que registra todos os débitos, créditos e ajustes.

Características:

* Imutável
* Auditável
* Fonte oficial da verdade financeira

---

## Reserva de Crédito

Pré-bloqueio temporário de valor durante o processo de autorização.

* Possui TTL
* Evita corrida de concorrência
* Convertida em débito no ledger após confirmação

---

## Fatura (Invoice)

Documento que consolida débitos em um período.

Tipos:

* SaaS Invoice (Provider → Acception)
* Provider Invoice (Conveniado → Provider)

---

## Inadimplência

Situação onde uma fatura venceu e não foi paga.

Estados possíveis:

* PAST_DUE
* LOCKED
* SUSPENDED

---

## Add-on

Funcionalidade adicional contratável separadamente do plano principal.

Exemplo:

* Gateway de pagamento do Provider

---

# 3️⃣ Conceitos de Autorização

## Autorização de Abastecimento

Processo de decisão se um abastecimento pode ou não ocorrer.

Resultado:

* ALLOW
* REVIEW
* DENY

---

## Policy Engine

Motor determinístico responsável por aplicar regras de negócio e antifraude.

---

## Regra Determinística

Regra fixa baseada em lógica explícita (ex: limite excedido).

Exemplo:

* AF-020 CREDIT_LIMIT_EXCEEDED

---

## Step-up

Ação adicional exigida para completar uma transação.

Exemplos:

* PIN do gerente
* Foto do hodômetro
* Comprovação geográfica

---

## ExternalTxId

Identificador único da transação enviado pelo app.

* Garante idempotência
* Unique por `provider_id`

---

## Idempotência

Garantia de que múltiplas requisições iguais não geram múltiplos efeitos financeiros.

---

# 4️⃣ Conceitos de IA

## Serviço de IA

Aplicação separada (Python/FastAPI) responsável por:

* Score de crédito
* Detecção de anomalia
* Recomendação de limite dinâmico
* Explicabilidade

---

## Score de Crédito

Pontuação probabilística de risco do conveniado.

---

## Risco de Fraude

Probabilidade de uma transação ser fraudulenta.

---

## Feature

Conjunto estruturado de dados enviados ao serviço de IA para avaliação.

---

## Model Version

Identificador da versão do modelo de IA usada na decisão.

---

# 5️⃣ Conceitos de Multitenancy

## provider_id

Identificador do tenant SaaS.

* Obrigatório em todas as tabelas de negócio.

---

## conveniado_id

Identificador da empresa dentro do provider.

* Usado para scoping.

---

## Scoping

Restrição de acesso baseada em `provider_id` e `conveniado_id`.

---

## RBAC (Role Based Access Control)

Sistema de controle de acesso baseado em papéis.

Papéis principais:

* PROVIDER_ADMIN
* PROVIDER_OPERATOR
* PROVIDER_MANAGER
* CONVENIADO_USER
* ACCECTION_ADMIN

---

# 6️⃣ Conceitos de Estados

## Tenant Billing Status

Estado financeiro do Provider em relação ao SaaS.

Valores:

* PENDING_VERIFICATION
* TRIAL_ACTIVE
* ACTIVE
* PAST_DUE
* SUSPENDED
* CANCELED

---

## Conveniado Credit Status

Estado do convênio dentro do provider.

Valores:

* ACTIVE
* PAST_DUE
* LOCKED
* BLOCKED
* CLOSED

---

## Refuel Transaction Status

Estado da transação de abastecimento.

Valores:

* PENDING_AUTH
* DENIED
* REVIEW
* AUTHORIZED
* POSTED
* REVERSED
* EXPIRED

---

# 7️⃣ Conceitos Operacionais

## App Frentista

Aplicação mobile usada pelo operador do posto.

* Online obrigatório
* Offline apenas pré-captura

---

## App Mecânico

Aplicação mobile usada na oficina (Fase 3).

* Registro de evidências
* Assinatura digital

---

## OS (Ordem de Serviço)

Documento operacional da oficina (Fase 3).

---

## Evidence (Evidência)

Arquivo comprobatório da operação.

Exemplos:

* Foto do hodômetro
* Prova geográfica
* Recibo

---

## Read Model

Estrutura otimizada para consulta rápida (ex: último abastecimento).

---

# 8️⃣ Conceitos de Desenvolvimento

## Clean Architecture

Separação em camadas:

* Presentation
* Application
* Domain
* Infrastructure

---

## Monólito Modular

Aplicação única organizada por módulos isolados.

---

## Spec Driven Development (SDD)

Metodologia onde:

1. Research
2. Planning
3. Implementação (IA)
4. Code Review (IA)
5. Validação (Humano)

---

## ADR (Architecture Decision Record)

Documento que registra decisão arquitetural e suas consequências.

---

## Monorepo

Repositório único contendo:

* Backend
* Frontend
* Mobile
* Serviços
* Packages

---

# 9️⃣ Termos Ambíguos (Definição Oficial)

| Termo        | Significado Oficial                                               |
| ------------ | ----------------------------------------------------------------- |
| Cliente      | Nunca usar isoladamente. Usar “Provider” ou “Conveniado”          |
| Conta        | Pode significar Tenant, Crédito ou Usuário — especificar sempre   |
| Plano        | Pode ser SaaS Plan ou Provider Plan — especificar                 |
| Bloqueio     | Pode ser LOCKED (inadimplência) ou BLOCKED (manual) — diferenciar |
| Suspensão    | Refere-se ao SaaS (tenant)                                        |
| Cancelamento | Encerramento definitivo                                           |

---

# 🔟 Convenções de Nomeação

* Tabelas: `snake_case`
* Enums: UPPER_SNAKE_CASE
* Rule IDs: `AF-XXX`
* Endpoints: `/api/<context>/<action>`
* UUID padrão para IDs
* Datas sempre em UTC ISO 8601

---

# 📌 Regra de Ouro do Projeto

Sempre diferenciar claramente:

* SaaS Billing (Acception ← Provider)
* Provider Billing (Provider ← Conveniado)
* Crédito (financeiro do provider)
* Autorização (operacional)
* Política (regras configuráveis)
* IA (probabilística, não determinística)

