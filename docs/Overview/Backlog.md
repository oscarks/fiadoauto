Perfeito. Abaixo está o **backlog inicial estruturado**, organizado por:

* ✅ Fases (1–4)
* ✅ Épicos → Features → User Stories (alto nível)
* ✅ Separação por Backend (NestJS), IA (Python/FastAPI), Portais (Vue), Apps Mobile (Flutter), Plataforma (SaaS)

⚠️ Alto nível, mas já estruturado para virar Jira/Linear.

---

# 🟢 FASE 1 — Postos: Abastecimento + Crédito

Antifraude Determinística no Backend

---

# 🔵 ÉPICO F1.1 — Multitenancy & Identidade (Base da Plataforma)

### 📦 Backend (NestJS)

#### Feature: Tenant Provider

* US1: Como Acception, quero criar automaticamente um tenant ao registrar um provider.
* US2: Como sistema, quero associar todas entidades a `provider_id`.
* US3: Como sistema, quero impedir queries sem provider_id.

#### Feature: RBAC + Scoping

* US4: Como provider admin, quero criar usuários operadores.
* US5: Como conveniado user, quero ver apenas dados da minha empresa.
* US6: Como sistema, quero aplicar scoping obrigatório por provider e conveniado.

---

# 🔵 ÉPICO F1.2 — Registro e Onboarding Provider

### 🌐 Portal da Solução (Vue)

#### Feature: Registro Provider

* US7: Como posto, quero registrar minha conta via email.
* US8: Como sistema, quero enviar confirmação por token.
* US9: Como sistema, quero criar tenant em modo trial.

#### Feature: Onboarding

* US10: Como provider, quero configurar dados do posto.
* US11: Quero configurar política básica de crédito.
* US12: Quero cadastrar meu primeiro convênio.
* US13: Quero simular primeira autorização.

---

# 🔵 ÉPICO F1.3 — Planos SaaS e Billing (Acception)

### 🏢 Plataforma (Admin Acception)

#### Feature: Gestão de Planos

* US14: Como Acception, quero definir planos Starter/Growth/Pro.
* US15: Quero configurar limites por plano (convênios, veículos, white-label).

#### Feature: Assinatura

* US16: Como provider, quero escolher plano.
* US17: Quero ativar trial configurável.
* US18: Quero pagar mensalidade via gateway.

#### Feature: Inadimplência SaaS

* US19: Como sistema, quero suspender tenant conforme política configurável.
* US20: Quero reativar automaticamente após pagamento.

---

# 🔵 ÉPICO F1.4 — Gestão de Convênios (Provider)

### 🌐 Portal Provider

#### Feature: Planos do Provider

* US21: Como provider, quero criar planos de convênio.
* US22: Quero limitar número de planos (conforme SaaS).
* US23: Quero editar e versionar planos.

#### Feature: Cadastro Conveniado

* US24: Como provider, quero cadastrar empresa manualmente.
* US25: Quero enviar link de ativação.
* US26: Como empresa, quero ativar conta via email.

---

# 🔵 ÉPICO F1.5 — Crédito & Ledger

### 📦 Backend (NestJS)

#### Feature: Conta Crédito

* US27: Como sistema, quero manter ledger append-only.
* US28: Quero calcular saldo materializado.
* US29: Quero reservar crédito antes de efetivar transação.

#### Feature: Limites

* US30: Como provider, quero definir limite global.
* US31: Quero definir limite por veículo.
* US32: Quero bloquear automaticamente por atraso.

---

# 🔵 ÉPICO F1.6 — Autorização + Antifraude Determinístico

### 📦 Backend

#### Feature: Policy Engine

* US33: Como sistema, quero aplicar regras determinísticas na ordem definida.
* US34: Quero retornar ALLOW/DENY/REVIEW com reason codes.

#### Feature: Regras Crédito

* US35: Bloquear quando limite excedido.
* US36: Aplicar limite por período.
* US37: Bloquear por atraso superior a X dias.

#### Feature: Antifraude

* US38: Detectar abastecimento muito frequente.
* US39: Detectar km/l anômalo.
* US40: Detectar duplicidade por external_tx_id.
* US41: Exigir PIN para valor alto.
* US42: Exigir foto para exceções.

---

# 🔵 ÉPICO F1.7 — App Frentista

### 📱 Mobile (Flutter)

#### Feature: Autorização Online

* US43: Como frentista, quero escanear QR/NFC.
* US44: Quero informar litros e odômetro.
* US45: Quero receber decisão em tempo real.

#### Feature: Step-up

* US46: Quero inserir PIN gerente quando exigido.
* US47: Quero tirar foto do hodômetro quando exigido.

#### Feature: Offline Controlado

* US48: Quero registrar pré-captura offline.
* US49: Quero sincronizar ao reconectar.

---

# 🔵 ÉPICO F1.8 — Contas a Receber do Provider

### 🌐 Portal Provider

#### Feature: Faturas

* US50: Gerar fatura mensal automática.
* US51: Visualizar extrato detalhado.
* US52: Registrar pagamento manual.

#### Feature: Inadimplência

* US53: Enviar aviso de vencimento.
* US54: Bloquear convênio automaticamente.

---

# 🔵 ÉPICO F1.9 — White-label

### 🌐 Portal Provider

* US55: Como provider Growth+, quero usar subdomínio.
* US56: Como provider Pro+, quero configurar domínio próprio.
* US57: Quero personalizar logo e cores.

---

---

# 🟡 FASE 2 — IA para Postos

Antifraude com IA + Score Crédito

---

# 🔶 ÉPICO F2.1 — Serviço de IA (Python)

### 🤖 IA (FastAPI)

#### Feature: Score Crédito

* US58: Como backend, quero enviar features e receber score.
* US59: Quero receber reason codes e model_version.
* US60: Quero armazenar score histórico.

#### Feature: Fraude Transacional

* US61: Como backend, quero enviar payload da transação.
* US62: Quero receber risco 0–1.
* US63: Quero combinar com regras determinísticas.

---

# 🔶 ÉPICO F2.2 — Integração Backend + IA

### 📦 Backend

* US64: Implementar timeout e fallback determinístico.
* US65: Registrar outputs IA no audit log.
* US66: Aplicar limite dinâmico recomendado.

---

# 🟡 FASE 3 — Oficinas

---

# 🔶 ÉPICO F3.1 — Módulo OS

### 📦 Backend

* US67: Criar OS vinculada a convênio.
* US68: Orçamento → aprovação → execução.
* US69: Integrar OS ao ledger.

### 🌐 Portal Provider/Oficina

* US70: Criar OS manualmente.
* US71: Enviar para aprovação da empresa.
* US72: Encerrar OS com evidências.

### 📱 App Mecânico

* US73: Tirar fotos antes/depois.
* US74: Capturar assinatura.

---

# 🔶 ÉPICO F3.2 — IA Oficina

### 🤖 IA

* US75: Detectar OS suspeita.
* US76: Sugerir diagnóstico.
* US77: Detectar padrão anômalo por peça.

---

# 🟣 FASE 4 — Parcerias (Posto + Oficinas com limite único)

---

# 🔷 ÉPICO F4.1 — Conta Compartilhada

### 📦 Backend

* US78: Permitir múltiplos providers vinculados ao mesmo convênio.
* US79: Manter limite único.
* US80: Ratear ledger entre providers.

---

# 🔷 ÉPICO F4.2 — IA Multi-Provider

### 🤖 IA

* US81: Avaliar risco agregado multi-provider.
* US82: Detectar concentração de exposição.
* US83: Ajustar limite considerando múltiplos pontos de consumo.

---

# 🔷 ÉPICO F4.3 — Liquidação entre Providers

### 📦 Backend

* US84: Calcular repasse entre posto e oficina.
* US85: Gerar relatório de liquidação.

---

# 🧱 Módulos Transversais (Todas as Fases)

## Observabilidade

* US86: Logs estruturados por provider.
* US87: Métricas de latência autorização.
* US88: Alertas de erro crítico.

## Internacionalização

* US89: Traduzir todos portais.
* US90: Traduzir mensagens e notificações.

## Notificações

* US91: Enviar email automático.
* US92: Webhook para integrações futuras.

---

# 📊 Backlog resumido por tecnologia

| Área              | F1                                         | F2             | F3           | F4                     |
| ----------------- | ------------------------------------------ | -------------- | ------------ | ---------------------- |
| Backend NestJS    | Core + Crédito + Antifraude determinístico | Integração IA  | OS + Oficina | Multi-provider         |
| IA Python         | —                                          | Score + Fraude | Fraude OS    | Risco agregado         |
| Portal Provider   | Convênios + Crédito                        | Score exibido  | OS           | Parcerias              |
| Portal Conveniado | Frota + Extratos                           | Score visível  | Aprovação OS | Consumo multi-provider |
| Portal Acception  | Billing SaaS                               | Monitor IA     | —            | Risco global           |
| App Frentista     | Autorização                                | Fraude IA      | —            | —                      |
| App Mecânico      | —                                          | —              | OS           | —                      |
