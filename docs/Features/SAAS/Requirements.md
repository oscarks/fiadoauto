Análise das funcionalidades de controle do SaaS em 5 blocos estratégicos:

1. 📦 Estruturação de planos (modelo de monetização B2B provider-first)
2. 👤 UC – Registro de novo provider (tenant)
3. 🚀 Onboarding estruturado (ativação real, não só cadastro)
4. 💳 Módulo de billing SaaS (recorrência, cobrança, inadimplência)
5. 📊 Dashboard da Acception (controle estratégico da operação SaaS)

---

# 1️⃣ Planos disponibilizados (modelo SaaS B2B para providers)

## Objetivo estratégico

* Cobrar de **postos/oficinas (providers)**, não dos conveniados.
* Escalonar conforme:

  * maturidade do provider
  * tamanho da carteira
  * complexidade (white-label, IA, antifraude avançado)
* Permitir crescimento natural.

---

## 1.1 Critérios estruturais para formação de planos

Sugiro que os planos sejam baseados em 4 eixos:

### Eixo A – Capacidade operacional

* Nº máximo de convênios (empresas)
* Nº máximo de veículos
* Nº de usuários (operadores)
* Nº de transações/mês

### Eixo B – Recursos funcionais

* White-label (sim/não)
* Personalização domínio próprio
* Políticas antifraude customizadas
* Exportação avançada
* API de integração
* OS (oficina) – liberado apenas a partir de plano específico (Fase 3)

### Eixo C – Inteligência (IA)

* Score de crédito
* Limite dinâmico
* Antifraude IA
* Relatórios preditivos

### Eixo D – SLA e suporte

* Suporte padrão
* Suporte prioritário
* Implantação assistida
* Gerente de conta

---

## 1.2 Proposta inicial de planos (Fase 1 – Postos)

### 🟢 Plano Starter (SMB pequeno)

Indicado para posto local iniciando convênios.

* Até 10 convênios
* Até 50 veículos
* Antifraude determinístico
* Relatórios básicos
* Sem white-label (usa domínio padrão da solução)
* Sem IA
* Suporte padrão

---

### 🔵 Plano Growth

Indicado para posto com carteira ativa.

* Até 50 convênios
* Até 300 veículos
* White-label (subdomínio)
* Limites configuráveis avançados
* Relatórios avançados
* Score crédito básico (IA Fase 2)
* Suporte prioritário

---

### 🟣 Plano Pro

Indicado para redes regionais.

* Convênios ilimitados (ou 200+)
* White-label domínio próprio
* IA completa (score + antifraude leve)
* Limite dinâmico
* Relatórios financeiros completos
* API
* Implantação assistida

---

### ⚫ Enterprise (futuro)

* Multi-unidade
* Parcerias (Fase 4)
* IA avançada
* SLA contratual

---

## 1.3 Estratégia de precificação

Modelo híbrido:

* Mensalidade base por plano
* Numero Maximo de convênio ativo
* Numero máximo de transação. Se ultrapassar, adicionado valor por transação (valor configurável)
* taxa por IA (addon) - Creditos

Isso evita:

* barreira de entrada alta
* subprecificação de grandes carteiras

---

# 2️⃣ UC – Registro de nova conta Provider (Tenant)

## Objetivo

Criar novo tenant de forma segura, automática e escalável.

---

## 2.1 Fluxo proposto

1. Usuário acessa Portal da Solução.
2. Clica em "Criar conta para meu posto".
3. Preenche formulário.
4. Confirma email.
5. Conta criada em modo TRIAL.
6. Onboarding guiado.
7. Escolhe plano.
8. Insere dados de pagamento.
9. Ativação definitiva.

---

## 2.2 Dados mínimos para registro

### Dados do Provider (empresa)

* Razão social
* Nome fantasia
* CNPJ
* Endereço
* Telefone
* Email administrativo
* Nome do responsável

### Dados do Usuário Admin

* Nome
* Email (username)
* Senha
* Aceite termos

---

## 2.3 Requisitos técnicos

* Usuário = email (único por tenant)
* Verificação por token com expiração (ex: 24h)
* Hash seguro (bcrypt/argon2)
* Tenant criado em status: `PENDING_VERIFICATION`
* Após confirmação: `TRIAL_ACTIVE`

---

# 3️⃣ Onboarding estruturado

Onboarding não é só cadastro. Ele precisa garantir:

✔ Provider configurou crédito
✔ Criou primeiro convênio
✔ Cadastrou primeiro veículo
✔ Configurou política básica
✔ Realizou primeira simulação

---

## 3.1 Etapas sugeridas

1. Boas-vindas
2. Configuração do posto
3. Política básica de crédito
4. Cadastro de primeiro convênio
5. Cadastro de primeiro veículo
6. Simulação de abastecimento
7. Configuração de cobrança
8. Escolha de plano

---

## 3.2 Recursos de onboarding

* Wizard guiado
* Checklist visual de progresso
* Tooltips contextuais
* Vídeos curtos
* Chat assistente (futuro IA)

---

# 4️⃣ Módulo de Billing SaaS (Acception)

Este módulo é interno (Acception controlando os providers).

---

## 4.1 Funcionalidades necessárias

### 4.1.1 Planos e assinatura

* Cadastro de planos
* Upgrade/downgrade
* Trial
* Cancelamento
* Suspensão automática por inadimplência

---

### 4.1.2 Integração com gateway (Asaas / Pagar.me)

Requisitos:

* Cobrança recorrente (mensal)
* Cartão de crédito
* Boleto
* Pix
* Webhook para confirmação de pagamento
* Cancelamento automático
* Retry automático (dunning)

---

### 4.1.3 Gestão de inadimplência SaaS

* Status: ativo → em atraso → suspenso → cancelado
* Grace period configurável (ex: 5 dias)
* Suspensão automática do tenant
* Notificações automáticas

---

### 4.1.4 Faturamento híbrido

Se houver variável por uso:

* apuração mensal
* geração de cobrança extra
* relatório detalhado por tenant

---

## 4.2 Dados principais necessários

* `subscriptions`
* `plans`
* `invoices`
* `payment_methods`
* `payment_events`
* `usage_metrics`
* `billing_status`

---

# 5️⃣ Dashboard da Acception

## Objetivo

Visão estratégica da saúde da plataforma.

---

## 5.1 Métricas SaaS

* Nº de tenants ativos
* Nº em trial
* Nº suspensos
* MRR
* ARR
* Churn
* Receita média por tenant
* CAC (futuro)
* LTV estimado

---

## 5.2 Métricas operacionais (risco agregado)

* Volume transacional total
* Crédito concedido total
* Inadimplência média
* Fraude detectada
* Carteira em risco (via IA futura)

---

## 5.3 Métricas de produto

* Taxa de ativação (tenant que concluiu onboarding)
* Tempo médio até primeira transação
* Uso de IA
* Uso de white-label

---

## 5.4 Alertas estratégicos

* Tenants com alto risco
* Tenants com inadimplência SaaS
* Queda brusca de uso
* Picos suspeitos

---

# 6️⃣ Riscos e decisões estratégicas

## 6.1 Cobrar por convênio ou por volume?

Recomendação:

* Plano base + variável por convênio ativo.
  Evita que posto com 100 convênios pague igual a um com 5.

---

## 6.2 White-label como diferencial pago?

Sim. White-label deve ser:

* Growth ou superior.
  É valor estratégico.

---

## 6.3 IA como add-on ou incluída?

Recomendação:

* Score básico incluído no Growth.
* IA antifraude avançada como add-on.

---

# 7️⃣ Decisões sobre o produto

1. Quer plano com cobrança variável por transação?
	 Implementar planos por faixa, p.ex.:
		 Plano Starter - ate 1000 + R$ 0.50 por transacao extra
		 Plano Growth - ate 2000 + R$ 0.40 por transacao extra
		 Plano Pro - ate 5000 + R$ 0.30 por transacao extra
	 A quantidade de transações e valor por transação extra devem ser configuravel  por plano
2. White-label disponível a partir de qual plano?
		Plano Starter - Sem white-label
		Plano Growth - White-label (subdominios)
		Plano Pro - White-Label (dominio proprio, o provider deve fornecer por sua conta)
3. Trial com tempo fixo (ex: 14 dias) ou até X convênios?
	Configuravel por plano, para permitir adaptar conforme percepção sobre o mercado
4. Suspensão SaaS deve bloquear totalmente o tenant ou apenas impedir novas autorizações?
	Configuravel
5. Billing separado para Fase 2 (oficinas) ou mesma estrutura?
	Na mesma Estrutura
---
