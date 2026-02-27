A seguir está o **Documento (Fase 1 – Postos)** para **Regras e Requisitos de Autorização + Antifraude Determinística**, contendo:

1. **Detalhamento das regras**
2. **Catálogo formal de regras (IDs, severidade, parâmetros, exemplos)**
3. **Dados mínimos (tabelas) para suportar as regras na Fase 1 (PostgreSQL/Prisma)**

> Escopo: **Fase 1 — Postos: abastecimento + crédito**, com **antifraude determinística no backend NestJS**.
> IA (Python/FastAPI) só entra nas fases seguintes.

---

# 1) Objetivo e escopo

## 1.1 Objetivos

* **Autorizar abastecimentos** com base em crédito/limites e governança do convênio.
* **Bloquear** situações inválidas / risco financeiro direto.
* **Reduzir fraude óbvia** com heurísticas determinísticas.
* **Prover trilha auditável**: “por que foi negado / revisado / aprovado”.

## 1.2 Decisão padrão (Policy Engine)

Saídas possíveis por transação:

* **ALLOW**: autorizado imediatamente
* **DENY**: negado (hard block / limite estourado / duplicidade etc.)
* **REVIEW**: permitido apenas com “step-up” (PIN, foto, etc.) e/ou revisão do gestor

> Em Fase 1, “REVIEW” é a válvula de segurança para SMB: evita negar tudo e reduz fraude com provas adicionais.

---

# 2) Requisitos para autorização e antifraude determinística

## 2.1 Requisitos funcionais (RF)

**RF-01 Autorização de abastecimento**
O backend deve receber um pedido do app frentista e retornar ALLOW/DENY/REVIEW com reason-codes e ações requeridas.

**RF-02 Validação de crédito e limites**
Verificar limite do convênio (CNPJ) e limites derivados (por veículo e por período).

**RF-03 Antifraude determinístico**
Aplicar regras de frequência, odômetro, tanque, duplicidade, preço vigente e risco de operador.

**RF-04 Step-up / prova**
Quando necessário, exigir ações adicionais (PIN do gerente, foto do hodômetro, etc.) antes de efetivar o débito.

**RF-05 Reserva de crédito (pré-autorização)**
Quando a transação for ALLOW/REVIEW, o sistema deve reservar valor por TTL curto, prevenindo corrida/duplicidade.

**RF-06 Ledger e auditoria**
Toda decisão deve gerar um registro imutável: contexto, regras disparadas, parâmetros, evidências e versões.

**RF-07 Pré-captura offline sem efetivar débito**
Se o app estiver offline, registrar pré-captura local e somente **submeter para autorização** quando reconectar.

---

## 2.2 Requisitos não funcionais (RNF)

**RNF-01 Latência**

* P95 ≤ 300ms para decisão determinística (sem IA), em condições normais.

**RNF-02 Disponibilidade**

* Policy Engine e rotas de autorização devem ser altamente disponíveis (alvo: ≥ 99.9% em produção).

**RNF-03 Idempotência**

* O backend deve ser idempotente por `external_tx_id` (do app) + `tenant_id` (e opcionalmente `device_id`).

**RNF-04 Consistência**

* Reserva e lançamento no ledger devem ser consistentes (transação DB + locks/serialização conforme necessário).

**RNF-05 Auditabilidade e explicabilidade determinística**

* Sempre retornar e armazenar `reason_codes`, `rule_ids`, `thresholds` aplicados e `policy_version`.

**RNF-06 Segurança**

* JWT + RBAC; mTLS/service-to-service (para evoluir); proteção contra replay; assinatura do payload do device opcional.

**RNF-07 LGPD / minimização**

* Armazenar somente o necessário; retenção configurável; evidências (fotos) com controle de acesso e expiração.

---

# 3) Fluxo de autorização (Fase 1)

## 3.1 Fluxo proposto

1. App frentista envia `AuthorizationRequest` com dados do abastecimento (veículo/convênio/produto/odômetro/valor).
2. Backend valida identidade/RBAC/tenant e normaliza contexto (`PolicyContext`).
3. Policy Engine roda regras em ordem (hard blocks → governança → limites → antifraude → step-up).
4. Retorna decisão:

   * **DENY**: não cria reserva, registra evento e evidências de negação.
   * **REVIEW**: cria reserva condicionada e lista `required_actions` (PIN/foto etc.).
   * **ALLOW**: cria reserva imediata.
5. Após confirmação final no app (e ações step-up), backend **efetiva**:

   * gera lançamento no ledger (débitos)
   * grava evidências (se houver)
   * fecha reserva

---

# 4) Detalhamento consolidado das regras determinísticas (Fase 1)

## 4.1 Camadas e ordem

1. **Hard Blocks** (negação imediata)
2. **Governança de uso** (campos obrigatórios, horários, geofence)
3. **Crédito e exposição** (limites, atraso, valor máximo por transação)
4. **Antifraude determinístico** (janela entre abastecimentos, odômetro, tanque, preço, operador)
5. **Step-up** (PIN, foto, confirmação adicional)

---

# 5) Catálogo formal de regras (IDs, severidade, parâmetros, exemplos)

## 5.1 Convenções

* **Severidade**:

  * `BLOCK_DENY` (nega sempre)
  * `DENY` (nega em regra)
  * `REVIEW` (exige step-up/revisão)
  * `STEP_UP` (ação extra obrigatória; decisão pode ser REVIEW→ALLOW após ação)
* **Reason codes**: string estável para UI, relatórios e auditoria.
* **Parâmetros**: configuráveis por tenant e/ou por convênio.

---

## 5.2 Regras — Hard Blocks (DENY imediato)

### AF-001 CONVENIO_BLOCKED

* **Severidade**: `BLOCK_DENY`
* **Condição**: convênio status ∈ {blocked, suspended, delinquent_locked}
* **Parâmetros**: —
* **Exemplo**: convênio bloqueado por inadimplência → DENY

### AF-002 VEHICLE_NOT_ALLOWED

* **Severidade**: `BLOCK_DENY`
* **Condição**: veículo inexistente, inativo ou não pertence ao convênio
* **Parâmetros**: —
* **Exemplo**: placa não cadastrada → DENY

### AF-003 OPERATOR_NOT_ALLOWED

* **Severidade**: `BLOCK_DENY`
* **Condição**: operador sem permissão para autorizar abastecimento
* **Parâmetros**: RBAC
* **Exemplo**: usuário “viewer” tentando autorizar → DENY

### AF-004 PRODUCT_NOT_ALLOWED

* **Severidade**: `BLOCK_DENY`
* **Condição**: produto não permitido pela política do convênio
* **Parâmetros**: lista de produtos permitidos
* **Exemplo**: convênio permite diesel, tentativa com gasolina → DENY

### AF-005 CONTRACT_INVALID

* **Severidade**: `BLOCK_DENY`
* **Condição**: contrato do convênio expirado/não aceito
* **Parâmetros**: —
* **Exemplo**: onboarding incompleto → DENY

---

## 5.3 Regras — Governança de uso

### AF-010 MISSING_COST_CENTER

* **Severidade**: `REVIEW`
* **Condição**: política exige centro de custo e não foi informado
* **Parâmetros**: `require_cost_center=true/false`
* **Exemplo**: convênio empresarial por CC → REVIEW + exigir seleção

### AF-011 MISSING_DRIVER

* **Severidade**: `REVIEW`
* **Condição**: política exige motorista e não informado
* **Parâmetros**: `require_driver=true/false`
* **Exemplo**: frota com motoristas cadastrados → REVIEW

### AF-012 OUT_OF_ALLOWED_SCHEDULE

* **Severidade**: `REVIEW` (ou `DENY`, configurável)
* **Condição**: fora da janela de horário/dia permitido
* **Parâmetros**: `allowed_days`, `start_time`, `end_time`, `mode=review|deny`
* **Exemplo**: convênio permite seg-sex 6h–20h; sábado 22h → REVIEW

### AF-013 GEOFENCE_MISMATCH

* **Severidade**: `REVIEW`
* **Condição**: geolocalização do device fora do raio do posto
* **Parâmetros**: `geofence_radius_m` (ex.: 150m)
* **Exemplo**: request originou a 2km do posto → REVIEW + foto obrigatória

---

## 5.4 Regras — Crédito e exposição (Fiado)

### AF-020 CREDIT_LIMIT_EXCEEDED

* **Severidade**: `DENY`
* **Condição**: saldo devedor + valor transação > limite do convênio
* **Parâmetros**: `credit_limit`
* **Exemplo**: limite R$ 5.000, saldo R$ 4.900, tentativa R$ 200 → DENY

### AF-021 VEHICLE_LIMIT_EXCEEDED

* **Severidade**: `DENY` ou `REVIEW` (config)
* **Condição**: gasto do veículo no período + valor > limite do veículo
* **Parâmetros**: `vehicle_limit`, `period=daily|weekly|monthly`, `mode=deny|review`
* **Exemplo**: veículo limite diário R$ 300, já gastou 290, quer 50 → DENY/REVIEW

### AF-022 PERIOD_LIMIT_EXCEEDED

* **Severidade**: `DENY` ou `REVIEW` (config)
* **Condição**: gasto do convênio no período + valor > limite do período
* **Parâmetros**: `period_limits` por período
* **Exemplo**: limite semanal convênio R$ 2.000, já 1.950, tenta 200 → REVIEW

### AF-023 TX_AMOUNT_ABOVE_MAX

* **Severidade**: `REVIEW`
* **Condição**: valor da transação > máximo por abastecimento
* **Parâmetros**: `max_tx_amount`, `step_up=manager_pin`
* **Exemplo**: acima de R$ 600 exige PIN do gerente → REVIEW + PIN

### AF-024 PAST_DUE_LOCK

* **Severidade**: `DENY`
* **Condição**: fatura vencida há mais de `lock_after_days`
* **Parâmetros**: `lock_after_days` (ex.: 10)
* **Exemplo**: 15 dias de atraso → DENY

### AF-025 PAST_DUE_REVIEW

* **Severidade**: `REVIEW`
* **Condição**: fatura vencida entre 1 e `lock_after_days`
* **Parâmetros**: `lock_after_days`, `step_up=manager_pin`
* **Exemplo**: 3 dias de atraso → REVIEW + PIN

### AF-026 CREDIT_RESERVATION_REQUIRED

* **Severidade**: `STEP_UP` (técnica)
* **Condição**: toda transação ALLOW/REVIEW deve criar reserva antes de efetivar
* **Parâmetros**: `reservation_ttl_seconds` (ex.: 600)
* **Exemplo**: reserva por 10 min evita corrida e duplicidade

---

## 5.5 Regras — Antifraude determinístico (Postos)

### AF-030 DUPLICATE_TX

* **Severidade**: `DENY` (ou replay-safe: retornar decisão anterior)
* **Condição**: `external_tx_id` já processado para o tenant
* **Parâmetros**: —
* **Exemplo**: app retransmitiu request → DENY ou “return cached”

### AF-031 FREQUENT_REFUELING

* **Severidade**: `REVIEW`
* **Condição**: abastecimento do mesmo veículo em intervalo < `min_refuel_interval_minutes`
* **Parâmetros**: `min_refuel_interval_minutes` (ex.: 120)
* **Exemplo**: abasteceu há 45 min → REVIEW + foto do hodômetro

### AF-032 TANK_CAPACITY_EXCEEDED

* **Severidade**: `REVIEW` (pode ser `DENY` se extremo)
* **Condição**: litros > capacidade_tanque * `tank_overfill_factor`
* **Parâmetros**: `tank_overfill_factor` (ex.: 1.10)
* **Exemplo**: tanque 60L, tentativa 80L → REVIEW/DENY

### AF-033 ODOMETER_REGRESSION

* **Severidade**: `REVIEW`
* **Condição**: odômetro atual < último odômetro − tolerância
* **Parâmetros**: `odometer_regression_tolerance_km` (ex.: 5)
* **Exemplo**: último 50.000, agora 49.700 → REVIEW

### AF-034 KM_PER_L_ANOMALY

* **Severidade**: `REVIEW`
* **Condição**: km/l calculado < `min_km_per_l` ou > `max_km_per_l`
* **Parâmetros**: thresholds por tipo de veículo (carro/moto/caminhão)
* **Exemplo**: caminhão acusando 30 km/l → REVIEW + foto

### AF-035 PRICE_MISMATCH

* **Severidade**: `REVIEW`
* **Condição**: preço informado no abastecimento difere do preço vigente do posto além de tolerância
* **Parâmetros**: `price_tolerance_percent` (ex.: 2%)
* **Exemplo**: diesel vigente 6,00/L, request 5,20/L → REVIEW

### AF-036 OPERATOR_RISK

* **Severidade**: `REVIEW`
* **Condição**: operador acima do limiar de exceções/estornos em janela
* **Parâmetros**: `operator_exception_threshold`, `window_hours`
* **Exemplo**: operador com 12 reversões em 6h → REVIEW sempre + alerta interno

### AF-037 REVERSAL_RATE_HIGH

* **Severidade**: `REVIEW`
* **Condição**: veículo/convênio com taxa de estornos acima do limiar
* **Parâmetros**: `reversal_rate_threshold`, `window_days`
* **Exemplo**: cliente com muitos estornos recentes → REVIEW

---

## 5.6 Regras — Step-up (ações obrigatórias)

### AF-040 REQUIRE_MANAGER_PIN

* **Severidade**: `STEP_UP`
* **Dispara em**: AF-023, AF-025, (opcional) AF-031/034
* **Parâmetros**: `pin_required=true`, `pin_ttl_seconds`
* **Exemplo**: acima de R$ 600 → pedir PIN

### AF-041 CAPTURE_ODOMETER_PHOTO

* **Severidade**: `STEP_UP`
* **Dispara em**: AF-031, AF-033, AF-034
* **Parâmetros**: `photo_required=true`
* **Exemplo**: km/l anômalo → foto do painel

### AF-042 CAPTURE_GEO_PROOF

* **Severidade**: `STEP_UP`
* **Dispara em**: AF-013
* **Parâmetros**: `geo_required=true`
* **Exemplo**: geofence mismatch → exigir geo + foto

---

# 6) Dados mínimos (tabelas) — Fase 1 (PostgreSQL / Prisma)

Abaixo o conjunto mínimo para suportar **autorização, limites, antifraude determinístico, reserva e auditoria**.

> Observação: nomes são sugestivos; você pode ajustar ao seu padrão (snake_case vs camelCase).
> Multi-tenant: toda entidade de negócio deve ter `tenant_id`.

---

## 6.1 Tenancy e identidade

### `tenants`

* `id` (PK)
* `name`
* `status` (active/suspended)
* `locale_default` (pt-BR)
* `created_at`

### `users`

* `id` (PK)
* `tenant_id` (FK tenants)
* `email`
* `name`
* `status`
* `created_at`

### `roles` / `user_roles`

* papéis: `PROVIDER_ADMIN`, `PROVIDER_OPERATOR`, `PROVIDER_MANAGER`, etc.

### `devices` (opcional, recomendado)

* `id`
* `tenant_id`
* `user_id`
* `device_fingerprint`
* `status`
* `last_seen_at`

---

## 6.2 Cadastro do posto e política

### `providers`  *(posto)*

* `id`
* `tenant_id`
* `legal_name`
* `trade_name`
* `cnpj`
* `timezone`
* `geofence_lat`, `geofence_lng`, `geofence_radius_m`
* `created_at`

### `policy_configs`

Configuração por tenant e overrides por convênio/veículo (via “scope”):

* `id`
* `tenant_id`
* `scope_type` (TENANT | CONVENIO | VEHICLE)
* `scope_id` (nullable)
* `policy_version`
* `require_driver` (bool)
* `require_cost_center` (bool)
* `allowed_days` (json)
* `allowed_time_start`, `allowed_time_end`
* `min_refuel_interval_minutes`
* `tank_overfill_factor`
* `odometer_regression_tolerance_km`
* `km_per_l_thresholds_json` (por tipo veículo)
* `price_tolerance_percent`
* `max_tx_amount`
* `lock_after_days`
* `created_at`

---

## 6.3 Conveniados e governança

### `conveniados` *(empresas)*

* `id`
* `tenant_id`
* `legal_name`
* `cnpj`
* `status` (active/blocked/suspended/delinquent_locked)
* `credit_limit`
* `billing_cycle_day` (ex.: 5)
* `created_at`

### `vehicles`

* `id`
* `tenant_id`
* `conveniado_id`
* `plate`
* `type` (car/moto/truck)
* `fuel_type_allowed` (json ou relação)
* `tank_capacity_liters` (nullable)
* `vehicle_credit_limit` (nullable)
* `status` (active/inactive)
* `last_odometer_km` (nullable)
* `last_refuel_at` (nullable)

### `drivers` *(opcional MVP, mas recomendado)*

* `id`
* `tenant_id`
* `conveniado_id`
* `name`
* `document` (nullable)
* `status`

### `cost_centers` *(opcional MVP)*

* `id`
* `tenant_id`
* `conveniado_id`
* `code`
* `name`
* `status`

---

## 6.4 Produtos e preços

### `products`

* `id`
* `tenant_id`
* `code` (DIESEL, GASOLINE, ETHANOL)
* `name`
* `status`

### `price_list`

* `id`
* `tenant_id`
* `product_id`
* `price_per_liter`
* `valid_from`
* `valid_to` (nullable)
* `status`

---

## 6.5 Crédito, ledger e reservas

### `credit_accounts` *(conta-corrente do convênio)*

* `id`
* `tenant_id`
* `conveniado_id`
* `credit_limit` (pode espelhar conveniado ou override)
* `current_balance` *(materialized: total devido)*
* `reserved_amount` *(materialized)*
* `status`

### `credit_reservations`

* `id`
* `tenant_id`
* `conveniado_id`
* `vehicle_id` (nullable)
* `external_tx_id`
* `amount`
* `status` (active/consumed/expired/canceled)
* `expires_at`
* `created_at`

### `ledger_entries` *(append-only)*

* `id`
* `tenant_id`
* `conveniado_id`
* `vehicle_id` (nullable)
* `type` (DEBIT/CREDIT/REVERSAL/ADJUSTMENT)
* `amount`
* `currency`
* `reference_type` (REFUEL_TX)
* `reference_id` (FK abastecimento)
* `created_at`
* `metadata_json` (reason codes, etc.)

> Nota: `current_balance` pode ser recomputado do ledger, mas materializar ajuda performance.

---

## 6.6 Transações de abastecimento e antifraude

### `refuel_transactions`

* `id`
* `tenant_id`
* `external_tx_id` *(idempotência)*
* `conveniado_id`
* `vehicle_id`
* `driver_id` (nullable)
* `cost_center_id` (nullable)
* `operator_user_id`
* `product_id`
* `liters`
* `total_amount`
* `price_per_liter`
* `odometer_km`
* `device_id` (nullable)
* `geo_lat`, `geo_lng` (nullable)
* `status` (authorized/denied/review/pending_capture/posted/reversed)
* `created_at`

### `authorization_decisions`

* `id`
* `tenant_id`
* `refuel_tx_id` (nullable se negar antes de criar)
* `external_tx_id`
* `decision` (ALLOW/DENY/REVIEW)
* `policy_version`
* `rule_hits_json` *(lista com rule_id, reason_code, params)*
* `required_actions_json`
* `created_at`

### `antifraud_signals`

* `id`
* `tenant_id`
* `refuel_tx_id`
* `signal_type` (FREQUENCY, KM_PER_L, PRICE_MISMATCH, GEOFENCE, OPERATOR_RISK...)
* `severity` (info/warn/high)
* `details_json`
* `created_at`

---

## 6.7 Evidências e auditoria

### `evidence_assets`

* `id`
* `tenant_id`
* `refuel_tx_id`
* `type` (ODOMETER_PHOTO, GEO_PROOF, RECEIPT)
* `storage_key` (S3/minio path)
* `hash`
* `created_at`
* `retention_until`

### `audit_log`

* `id`
* `tenant_id`
* `actor_user_id` (nullable)
* `action` (AUTH_REQUESTED, AUTH_DECIDED, RESERVATION_CREATED, LEDGER_POSTED...)
* `entity_type`
* `entity_id`
* `details_json`
* `created_at`

---

# 7) Observações de desenho (para reduzir risco e custo na Fase 1)

1. **Read models** para performance (último abastecimento, gastos por período, saldo, taxa de reversão por operador) — evita queries pesadas na autorização.
2. **Idempotência obrigatória** com `external_tx_id` + unique index por tenant.
3. **Reserva de crédito** com TTL para prevenir dupla captura e corrida.
4. **REVIEW com step-up** (PIN/foto) como padrão para outliers (reduz fraude sem travar operação).
5. **Offline somente pré-captura** (sem débito), exigindo sincronização online para autorizar.

---

# 8) Índices e constraints mínimas (recomendado)

* Unique: `(tenant_id, external_tx_id)` em `refuel_transactions` e/ou `authorization_decisions`
* Index: `(tenant_id, vehicle_id, created_at desc)` em `refuel_transactions`
* Index: `(tenant_id, conveniado_id, created_at desc)` em `ledger_entries`
* Index: `(tenant_id, operator_user_id, created_at desc)` em `refuel_transactions`
* FK + `ON DELETE RESTRICT` para preservar trilha

---
