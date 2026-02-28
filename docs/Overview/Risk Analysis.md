Com as **decisões estratégicas (provider-first, white-label, SMB, ledger unificado, parcerias posto-oficina)** e os **gaps escolhidos**, segue a **Análise de Riscos estruturada** (segurança, jurídica/regulatória, complexidade operacional/tecnológica e risco de negócio).
A abordagem considera o contexto brasileiro de crédito comercial (“fiado B2B”) e operação em campo (posto/oficina).

---

# Análise de Risco da Solução “Fiado Frota Provider-First”

## 1) Riscos Jurídico-Regulatórios

### 1.1 Natureza do “fiado” (crédito mercantil vs. crédito financeiro)

**Descrição**
A solução prevê concessão de limite e cobrança parcelada pelo próprio posto/oficina (provider).
No Brasil, isso normalmente é **crédito mercantil (venda a prazo)** — não regulado pelo BACEN — **desde que não haja intermediação financeira típica**.

**Risco**

* Se a plataforma atuar como **intermediadora de crédito**, factoring, antecipação, juros estruturados etc., pode caracterizar:

  * instituição financeira
  * SCD/SEP (BACEN)
  * correspondente bancário

**Impacto**
Alto (regulatório + penal)

**Mitigação**

* Contratos claros: **o crédito é do provider**, não da plataforma
* Plataforma = **software de gestão e cobrança**
* Não financiar nem antecipar recebíveis (ou fazer via parceiro regulado)
* Evitar cobrança direta ao cliente em nome próprio
* White-label: marca do posto/oficina

**Status com decisões atuais**
✔ alinhado (provider-first)

---

### 1.2 Responsabilidade solidária em parcerias posto-oficina

**Descrição**
Posto cria rede de oficinas parceiras usando o mesmo limite do cliente.

**Risco**

* Cliente pode alegar:

  * defeito no serviço da oficina
  * cobrança indevida
  * garantia
* E acionar o posto (dono do convênio)

**Impacto**
Médio-alto

**Mitigação**

* Contratos tripartites (posto-oficina-cliente)
* Termos de responsabilidade por serviço
* OS com aceite digital
* trilha de auditoria
* SLA e política de garantia por parceiro

---

### 1.3 LGPD (dados pessoais e telemetria)

**Dados envolvidos**

* motorista
* placa
* localização
* hábitos de consumo
* hodômetro
* fotos/QR/NFC

**Risco**
Tratamento de dados pessoais sensíveis operacionais

**Impacto**
Alto (multas + reputação)

**Mitigação**

* Base legal: execução de contrato B2B
* Minimização de dados
* anonimização de relatórios
* DPA com providers
* segregação multi-tenant
* retenção configurável

---

### 1.4 Juros, multa e cobrança

**Descrição**
Fiado envolve encargos e cobrança.

**Risco**

* taxas abusivas
* ausência de contrato formal
* disputa judicial
* protesto indevido

**Mitigação**

* parametrização conforme legislação
* contrato digital do convênio
* política de cobrança configurável
* histórico imutável de transações

---

## 2) Riscos de Segurança

### 2.1 Fraude de abastecimento

**Cenários**

* abastecimento fantasma
* uso indevido de placa
* conluio frentista-motorista
* combustível fora do convênio

**Impacto**
Alto (perda financeira direta)

**Mitigação técnica (alinhada ao seu design)**
✔ QR por veículo
✔ NFC tag no veículo
✔ validação app frentista
✔ hodômetro obrigatório
✔ foto opcional
✔ geolocalização
✔ limites por produto/veículo
✔ detecção de anomalia

---

### 2.2 Fraude de OS de oficina

**Cenários**

* peças não instaladas
* serviço inexistente
* valor inflado
* aprovação falsa

**Mitigação**

* workflow OS:
  orçamento → aprovação → execução → entrega
* fotos antes/depois
* assinatura digital
* checklists
* auditoria

---

### 2.3 Comprometimento de limite/ledger

**Descrição**
Ledger é o núcleo financeiro do sistema.

**Risco**

* alteração de saldo
* transação duplicada
* perda de consistência
* concorrência

**Impacto**
Crítico

**Mitigação**

* ledger imutável (append-only)
* eventos auditáveis
* idempotência
* reconciliação
* versionamento de saldo
* trilha contábil

---

### 2.4 White-label multi-tenant

**Risco**

* vazamento entre tenants
* acesso cruzado
* branding incorreto

**Mitigação**

* isolamento lógico forte
* tenant-id em todas entidades
* controle RBAC
* segregação de dados por provider

---

## 3) Riscos de Complexidade Tecnológica

### 3.1 Ledger unificado abastecimento + OS

**Desafio**
Unificar:

* combustível (quantidade)
* peças (SKU)
* serviços (tempo)
* encargos (financeiro)

**Risco**
Modelagem inadequada → inconsistência contábil

**Mitigação**
Modelo de eventos financeiros:

* débito
* crédito
* ajuste
* estorno
* bloqueio
* liberação

---

### 3.2 Workflow de oficina

Oficina tem:

* diagnóstico
* orçamento
* aprovação
* execução
* garantia

**Risco**
Alto escopo → produto pesado

**Mitigação**
MVP:

* OS simples
* itens
* status
* aprovação
* faturamento

---

### 3.3 Mobile operacional em campo

Frentista/mecânico:

* baixa conectividade
* uso rápido
* ambiente hostil

**Riscos**

* falha offline
* latência
* erro humano

**Mitigação**

* modo offline
* sync posterior
* UI mínima
* leitura QR/NFC robusta

---

### 3.4 Parcerias posto-oficina

**Complexidade**

* múltiplos providers
* limite compartilhado
* faturamento cruzado

**Mitigação**
Modelo:

* provider líder (posto)
* parceiros subordinados
* rateio configurável
* liquidação entre parceiros

---

## 4) Riscos de Negócio / Adoção

### 4.1 Capacidade de crédito do posto

SMB pode:

* não ter capital
* inadimplência alta

**Risco**
quebra financeira do provider

**Mitigação**

* limites conservadores
* scoring básico
* bloqueio automático
* aging de dívida
* alertas

---

### 4.2 Cultura de controle fraca em SMB

Postos pequenos:

* informalidade
* resistência a sistema

**Risco**
não adoção

**Mitigação**

* UX simples
* implantação assistida
* white-label
* relatórios financeiros claros

---

### 4.3 Conflito com cartões frota existentes

Cliente já usa:

* Ticket Log
* Veloe
* etc

**Risco**
duplicidade

**Mitigação**
Posicionamento:
✔ convênio local
✔ flexível
✔ sem taxa de emissor
✔ relação direta

---

### 4.4 Rede de oficinas

Posto pode não ter parceiros confiáveis.

**Risco**
má experiência do cliente

**Mitigação**

* certificação de parceiros
* avaliação
* SLA
* reputação

---

## 5) Riscos Financeiros (do modelo)

### 5.1 Inadimplência

Principal risco do fiado.

**Mitigação**

* limite dinâmico
* aging
* bloqueio automático
* histórico
* renegociação
* alertas

---

### 5.2 Conciliação financeira

Posto + oficinas + clientes.

**Risco**
diferenças de saldo

**Mitigação**
ledger central + relatórios:

* por cliente
* por parceiro
* por período

---

## 6) Riscos Arquiteturais Críticos

### Risco A — Ledger inconsistente

Impacto: crítico
Mitigação: event sourcing financeiro

### Risco B — fraude operacional

Impacto: alto
Mitigação: QR/NFC + validação

### Risco C — interpretação como fintech

Impacto: crítico
Mitigação: provider como credor

### Risco D — multi-tenant vazamento

Impacto: crítico
Mitigação: isolamento forte

---

# Síntese de Risco Geral da Solução

**Nível global:** Médio-alto
(mas controlável)

Porque:

* crédito B2B
* operação física
* múltiplos atores
* ledger financeiro

Mas:
✔ alinhado ao mercado local
✔ fora de regulação financeira se bem estruturado
✔ gaps reais
✔ viável para SMB

---

# Conclusão da Análise

A solução é **viável e defensável**, porém depende de 3 pilares críticos:

1. Arquitetura financeira robusta (ledger imutável)
2. Modelo jurídico claro (crédito do provider)
3. Antifraude operacional (QR/NFC/mobile)
