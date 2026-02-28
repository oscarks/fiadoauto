Aanálise da **camada B2B2B** (Provider → Empresas Conveniadas), mantendo coerência com o modelo SaaS da Acception, mas agora olhando o provider como “mini SaaS financeiro”.

---

# 1️⃣ Planos definidos pelo próprio Provider (para seus conveniados)

## Objetivo

Permitir que o **posto/oficina crie seus próprios planos de convênio**, usando critérios fornecidos pelo sistema, mas com parâmetros definidos pelo provider.

Isso transforma o provider em:

* operador de crédito
* gestor de risco
* gestor de carteira

---

## 1.1 Estrutura sugerida de planos do Provider

O sistema deve oferecer **modelo parametrizável**, não planos fixos.

### Estrutura-base do Plano do Convênio

Cada plano criado pelo provider pode conter:

### A) Crédito

* Limite global (R$)
* Limite por veículo
* Limite por período (dia/semana/mês)
* Prazo de pagamento (ex: 15, 30, 45 dias)
* Juros por atraso (%)
* Multa (%)
* Lock automático após X dias

### B) Governança

* Exigir motorista?
* Exigir centro de custo?
* Horário permitido?
* Produtos permitidos?
* Abastecimento mínimo entre janelas (min_refuel_interval)
* Valor máximo por transação

### C) Antifraude

* Ativar odômetro obrigatório?
* Exigir foto em caso de exceção?
* Exigir PIN para valores altos?
* Geofence obrigatória?

### D) Condições comerciais

* Desconto no litro?
* Preço especial?
* Taxa administrativa?
* Taxa de serviço?

---

## 1.2 Tipos de planos que providers provavelmente criarão

Exemplos práticos:

### Plano Básico

* Limite pequeno
* Prazo 15 dias
* Sem desconto
* Regras rígidas

### Plano Gold

* Limite maior
* Prazo 30 dias
* Desconto no litro
* Flexibilidade maior

### Plano Corporate

* Limite alto
* Prazo 45 dias
* Aprovação manual de exceções
* SLA diferenciado

---

## 1.3 Governança recomendada

O sistema deve:

* Fornecer **template de planos**
* Permitir duplicar plano
* Versionar plano
* Exigir justificativa ao aumentar limite significativamente
* Registrar histórico de alterações (auditável)

---

# 2️⃣ Registro e onboarding da Empresa no ambiente do Provider

## 2.1 Modelos possíveis

### Modelo A — Provider cria o convênio

Fluxo típico SMB:

1. Provider cadastra empresa.
2. Define plano.
3. Gera link de ativação.
4. Empresa confirma email.
5. Empresa completa cadastro (veículos/motoristas).

### Modelo B — Empresa solicita convênio

1. Empresa acessa portal white-label.
2. Solicita convênio.
3. Provider aprova.
4. Define plano.
5. Ativação.

Recomendação: Suportar ambos.

---

## 2.2 Dados mínimos da Empresa

* Razão social
* CNPJ
* Endereço
* Responsável
* Email
* Telefone
* Centro de custo padrão (opcional)
* Documentos (contrato social – opcional futuro)

---

## 2.3 Etapas de onboarding do Conveniado

1. Confirmação de email
2. Cadastro de veículos
3. Cadastro de motoristas (opcional)
4. Definição de centros de custo
5. Leitura e aceite de contrato
6. Primeira simulação

---

## 2.4 Status do convênio

* PENDING_APPROVAL
* ACTIVE
* BLOCKED
* DELINQUENT
* SUSPENDED
* CLOSED

---

# 3️⃣ Controles do Provider sobre seus Clientes

Aqui está o núcleo financeiro da operação do posto.

---

## 3.1 Dashboard do Provider

Indicadores principais:

* Total de crédito concedido
* Saldo devedor total
* Inadimplência (%)
* Aging (0–30, 31–60, 61+)
* Convênios bloqueados
* Receita gerada por convênio

---

## 3.2 Módulo de Contas a Receber (Provider)

### Funcionalidades necessárias

* Geração automática de fatura (mensal ou conforme ciclo)
* Visualização detalhada por transação
* Exportação PDF/CSV
* Baixa manual
* Registro de pagamento parcial
* Registro de renegociação
* Histórico de cobrança

---

## 3.3 Cobrança e Inadimplência

Estados de cobrança:

* Aberta
* Vencida
* Em cobrança
* Renegociada
* Paga
* Protestada (futuro)

Funcionalidades:

* Envio automático de cobrança por email
* Notificação antes do vencimento
* Bloqueio automático conforme política
* Ajuste manual de bloqueio

---

## 3.4 Integração com Gateway (opcional por provider)

Importante decisão arquitetural:

O provider pode:

1. Cobrar manualmente
2. Usar gateway integrado (ex: Asaas)
3. Usar link de pagamento

Sistema deve permitir:

* Configuração de gateway por provider
* Webhook para confirmação
* Conciliação automática

---

## 3.5 Gestão de Risco da Carteira (determinístico na Fase 1)

Indicadores importantes:

* Uso médio do limite (%)
* Taxa de atraso por convênio
* Crescimento abrupto de consumo
* Concentração de carteira (1 cliente > 40% do risco)

Esses dados já devem existir para futura IA.

---

# 4️⃣ Governança Financeira do Provider

## 4.1 Limite agregado de exposição

Provider deve ver:

* Exposição total da carteira
* % do capital comprometido
* Alertas de concentração

---

## 4.2 Regras automáticas recomendadas

* Bloqueio automático após X dias
* Redução automática de limite após atraso
* Limite progressivo por tempo de relacionamento

---

# 5️⃣ Pontos estratégicos importantes

## 5.1 Separação clara de responsabilidades

* Acception: SaaS
* Provider: crédito e cobrança
* Conveniado: consumo

Evitar que a plataforma se torne “corresponsável financeira”.

---

## 5.2 White-label consistente

Portal do provider deve:

* esconder marca da solução
* usar domínio próprio
* ter identidade visual customizada

Mas backend permanece centralizado.

---

## 5.3 Contrato Digital

Sistema deve permitir:

* upload de contrato
* aceite eletrônico
* registro de IP/data

Isso protege juridicamente o provider.

---

## 5.4 Gestão de exceções

Provider deve poder:

* Autorizar manualmente acima do limite
* Liberar temporariamente convênio bloqueado
* Ajustar saldo manualmente (com auditoria)

---

# 6️⃣ Arquitetura de Billing do Provider vs Billing da Acception

Importante separar:

| Camada                       | Responsável | Sistema                    |
| ---------------------------- | ----------- | -------------------------- |
| SaaS Billing                 | Acception   | Módulo SaaS                |
| Crédito e Fatura do Convênio | Provider    | Módulo Financeiro Provider |

Mesma arquitetura base, mas escopos diferentes.

---

# 7️⃣ Riscos a considerar

1. Provider conceder crédito irresponsável.
2. Falta de formalização de contrato.
3. Inadimplência alta.
4. Uso indevido de desconto/preço.
5. Falta de cobrança automatizada.

Sistema deve incentivar boas práticas.

---

# 8️⃣ Definições

1. Provider pode criar quantos planos quiser?
	Limite definido no sistema pela acception
2. Quer permitir cobrança automática via gateway ou deixar opcional?
	Definir como uma feature a ser contratada pelo provider (adicional ao plano do provider, contratada em separado)
3. Quer que o sistema gere contrato padrão automático?
	Sim, baseado em um template que o tenant possa personalizar, ja fornece um contrato default
4. Convênio pode ter múltiplos planos ativos ou apenas um?
	Apenas 1 (um)
5. Vai permitir renegociação parcelada dentro do sistema?
	No inicio não, depois pode entrar como uma fase posterior


