Segue a **lista consolidada de módulos** a serem implementados, já refletindo **todas as decisões** tomadas (Provider = tenant real; Empresa = escopo; IA separada em Python a partir da Fase 2; portais Vue unificados onde aplicável; billing SaaS + billing do provider; internacionalização pt-BR/en-US/es-ES; sem RLS por enquanto; módulos adicionais incorporados).

---

## A) Core SaaS e Plataforma (Acception)

1. **Tenant & Identity (Multi-tenant + RBAC + Scoping)**

* Provider = tenant real
* Empresa (conveniado) = escopo dentro do provider
* Usuários: provider users, conveniado users, acception admins
* RBAC + scoping obrigatório (provider_id sempre; conveniado_id para usuários do conveniado)
* Gestão de roles/permissões, convites, reset, device registry (opcional)

2. **Portal da Solução (Público + Cadastro) — Vue 3**

* Landing pages do produto
* Catálogo público de postos/oficinas (listagem, busca, filtros)
* Registro de provider (tenant) + confirmação por email
* Login único para redirecionar para portais white-label

3. **Onboarding Engine (Provider)**

* Wizard/checklist de ativação do provider
* Configuração inicial: dados do posto, política de crédito, primeiro convênio, primeiro veículo, simulação de autorização
* Status do tenant: pending → verified → trial → active

4. **Billing SaaS da Acception (Assinaturas, Cobrança, Inadimplência)**

* Planos SaaS (Starter/Growth/Pro/Enterprise)
* Trial configurável por plano (tempo e/ou limites)
* Suspensão configurável (bloqueio total vs impedir novas autorizações)
* Integração gateway (Asaas/Pagar.me) via webhooks
* Cobrança recorrente + formas (cartão/boleto/pix), dunning/retry
* Métricas de uso (para variável por convênio/transação se aplicável)

5. **Portal de Gestão da Solução (Acception Admin) — Vue 3**

* Gestão de tenants (postos/oficinas) e status
* Gestão de planos/assinaturas/billing
* Monitoramento de risco agregado (inadimplência, fraude, volume)
* Suporte operacional (impersonation auditada, logs)
* Provisionamento white-label (domínio/SSL/temas)
* CMS básico do portal público (opcional)

6. **Observabilidade & Auditoria (Plataforma)**

* Audit log imutável
* Telemetria, métricas, tracing
* Gestão de evidências (evidence vault) com retenção e LGPD
* Relatórios de compliance

7. **Internacionalização (i18n) – Plataforma**

* pt-BR, en-US, es-ES em todos módulos (web e mobile)
* templates de mensagens (email, cobrança, alertas)

---

## B) Domínio Provider-first (Postos/Oficinas)

8. **Portal Provider (Operacional + Admin no mesmo app) — Vue 3 (White-label)**
   Áreas separadas (mesmo app):

* **Operacional**: convênios, crédito, extratos, faturas, alertas antifraude, relatórios, bloqueios
* **Admin**: usuários, RBAC, políticas, catálogo e preços, branding, integrações, gateway provider (add-on), configurações

9. **Gestão de Convênios (Empresas) + Planos do Provider**

* Provider cria N planos (com limite máximo definido pela Acception)
* Cada convênio tem **1 plano ativo**
* Contrato digital: template default + personalização por provider
* Cadastro/convite/ativação do conveniado

10. **Portal do Conveniado (Empresa) — Vue 3 (White-label do provider)**

* Gestão de frota: veículos, motoristas (opcional MVP), centros de custo
* Extratos, faturas, consumo por veículo/CC/motorista
* Regras internas (sub-limites)
* Solicitações/atendimento (opcional)

11. **Catálogo de Produtos e Preços (Posto)**

* Produtos (combustíveis etc.)
* Price list vigente e histórico
* Regras de produto permitido por convênio/plano

12. **Autorização de Abastecimento + Policy Engine (Determinístico) — Backend**

* Decisão ALLOW/DENY/REVIEW
* Catálogo formal de regras antifraude determinísticas (fase 1)
* Reserva de crédito, idempotência, trilha de decisão
* Step-up: PIN gerente, foto hodômetro, geofence, etc.

13. **Ledger (Conta-corrente) + Crédito (Fiado)**

* Lançamentos append-only
* Saldos materializados
* Limites por convênio/veículo/período
* Bloqueio automático por inadimplência do convênio
* Conciliação e estornos

14. **Contas a Receber do Provider (Cobrança do Convênio)**

* Faturas, ciclos, vencimentos
* Cobrança e tratamento de inadimplência do convênio (sem renegociação parcelada no início)
* Envio de cobranças/avisos
* Baixa manual e conciliação

15. **Gateway de Pagamento do Provider (Add-on contratável)**

* Integração opcional para cobrança automática do convênio
* Asaas/Pagar.me: recorrência ou cobrança avulsa/link
* Webhooks + conciliação automática

16. **Notificações (Plataforma)**

* Email (obrigatório no MVP)
* SMS/WhatsApp (futuro)
* Eventos: ativação, cobranças, vencimentos, bloqueios, alertas antifraude, aprovações

17. **Evidence Vault (Provas)**

* Fotos do hodômetro, geo, recibos
* Storage (S3/MinIO)
* Hash, retenção, controle de acesso

---

## C) Apps Mobile Operacionais (Campo)

18. **App Frentista (Flutter)**

* Online obrigatório
* Offline apenas pré-captura (sem débito) → sincroniza para autorização
* QR/NFC, odômetro, foto, geo
* Finalização do abastecimento + recibo

19. **App Mecânico (Flutter) — Fase 3**

* Em Fase 3 (quando oficinas entram)
* Fotos/assinatura/evidências
* Parte do fluxo pode existir no portal web da oficina

---

## D) IA (separada) — a partir da Fase 2

20. **Serviço de IA (Python/FastAPI)**

* Score de crédito (assíncrono)
* Detecção de anomalia (fraude) (síncrono leve)
* Recomendação de limite dinâmico
* Explicações (reason codes/features)

21. **Feature Builder / Data Layer para IA**

* Construção de features (no backend) e envio stateless para IA
* Versionamento de payload/feature set
* Armazenamento de outputs (model_version, scores) no backend para auditoria

---

## E) Oficina e Parcerias (Roadmap)

22. **Módulo de OS (Oficina) integrado ao crédito — Fase 3**

* OS: abertura → orçamento → aprovação → execução → entrega → faturamento
* Itens de peças/serviços
* Reserva/consumo de limite
* Evidências

23. **Parcerias Posto + Oficinas com Limite Único — Fase 4**

* Conta crédito compartilhada
* Liquidação/rateio entre providers
* Exposição de risco agregada
* IA considera múltiplos providers

---

### Observação final (importante)

Mesmo que oficinas/OS e parcerias sejam Fase 3/4, **alguns componentes devem existir desde o início** para evitar retrabalho:

* modelo de ledger/eventos genérico
* engine de políticas extensível
* auditoria/evidências
* notificações
