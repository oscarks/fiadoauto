# Prompts

Prompts da fase de desenvolvimento

## Especificação da Fase 1

```
Voce e um engenheiro de software e tem como objetivo planejar o desenvolvimento das fases do projeto

Analise os documentos:
@docs/Overview/Product.md
@docs/Overview/Backlog.md
@docs/Overview/Modules.md
@docs/Overview/Risk Analysis.md
@docs/Architecture/Architecture Overview.md
@docs/Multitenancy/Requirements.md
@docs/SAAS/Requirements.md
@docs/SAAS-Provider/Requirements.md
Outros documento q achar necessario

Analise a **FASE 1** definida no Backlog, gere um documento consolidando a especificacao pra implementação da fase, definindo a proposta de solução de forma a nao haver ambiguidade, duvida ou pontos em aberto.
Solicite informações quando necessario
Quando houver mais de uma possibilidade de solução de implementação, solicite a seleção da alternativa a ser seguida. Documente as decicoes tomadas mostrando o cenario da decisao e as possibilidades existentes, algumas decisoes podem ser tomadas nesta fase do projeto e depois evoluida de forma incremental

Gere o documento em @docs/Features/Phase1-Specification.md

```


## Plano de Implementação Fase **F1.A. Fundacional**

```
Baseado nos documentos 'Phase1 - Specification.md' e  @docs/Guidelines/ui-templates.md, gere um plano de implementacao para etapa **F1.A - Fundacional (Core + Auth + Tenancy) com o detalhamento do que precisa ser feito para implementação da fase.
Analise tambem o documento @docs/Guidelines/ui-templates.md e adicione ao plano de implementação as tasks necessárias para implementar a UI definida no documento.

O documento do plano de implementação deve contemplar:

- User Stories a serem implementadas, incluindo todas as interações do frontend, como login, register (signup), seleção de plano, cadastros, operacoes como ativação/destivação, etc
- Tasks necessarias para a implementação das user stories ou de features
- Plano de implementação dividido em sprints independentes e logicamente encadeadas

Crie todos os User Stories e Tasks necessarios para tornar funcional o sistema no que se refere a fase *F1.A* e que nao esteja contido em outras fases posteriores

As tasks para serem definidas, nao é necessario definir o codigo a ser implementado, se for preciso use um algoritimo em pseudo codigo simplificado. Adicione diagramas UML (plantuml) quando for importante para o entendimento (classe, sequencia, atividade, etc)

Salve o documento em docs/Features/F1A-Implementation-Plan.md
```


---

## Implementação F1A

### Sprint 1

```
Você é um agente de IA responsável por implementar a etapa **F1A - Fundacional** da *Fase 1* no projeto FiadoAuto .

REGRAS ABSOLUTAS:
- Backend: Nestjs + Prisma
- Frontend: Vue 3 + Vuetify + Pinia
- Servicos de IA: Python, uv, FastApi
- Clean Architecture obrigatória
- VERIFIQUE SE JA ESISTE ALGUMA COISA IMPLEMENTADA para evitar duplicacao, se ja existir altere SOMENTE SE FOR NECESSARIO para versao que esta sendo solicitado agora.
- Servicos de IA:
	- Respeite a arquitetura definida
	- NÃO altere decisões arquiteturais existentes
	- NÃO crie atalhos ou acoplamentos indevidos
	- NÃO misture camadas (controller ≠ service ≠ domain)
	- Sempre considerar multi-tenancy
- Backend:
	- Respeite a arquitetura definida (NestJS + Prisma)
	- NÃO altere decisões arquiteturais existentes
	- NÃO crie atalhos ou acoplamentos indevidos
	- NÃO misture camadas (controller ≠ service ≠ domain)
	- Sempre considerar multi-tenancy (tenantId)
- Frontend:
	- Respeite a arquitura definida: Vue 3 + Vuetify + Pinia + Clean Architecture
	- NÃO criar mocks hardcoded
	- NÃO misturar camadas (Presentation / Application / Domain / Infrastructure)
	- Usar stores para estado
	- Usar services/adapters para HTTP

- Se algo não estiver definido, PERGUNTE antes de assumir
- NÃO implementar funcionalidades fora da fase/sprint solicitada
- Criar os testes unitarios
- Para implementação se baseie nos documentos:
   @docs/Features/F1A-Implementation-Plan.md
   @docs/Features/Phase1-Specification-Plan.md

- Caso necessite consulte os documentos da pasta docs

Implemente APENAS a sprint solicitada.

---

Para implementação ler o documento: @docs/Features/F1A-Implementation-Plan.md

***IMPLEMENTAR:**

Implementar: **Sprint 1 - Infraestrutura & Database**

```

---

### Sprint 2

Você é um agente de IA responsável por implementar a etapa **F1A - Fundacional** da *Fase 1* no projeto FiadoAuto .

REGRAS ABSOLUTAS:
- Backend: Nestjs + Prisma
- Frontend: Vue 3 + Vuetify + Pinia
- Servicos de IA: Python, uv, FastApi
- Clean Architecture obrigatória
- VERIFIQUE SE JA ESISTE ALGUMA COISA IMPLEMENTADA para evitar duplicacao, se ja existir altere SOMENTE SE FOR NECESSARIO para versao que esta sendo solicitado agora.
- Servicos de IA:
	- Respeite a arquitetura definida
	- NÃO altere decisões arquiteturais existentes
	- NÃO crie atalhos ou acoplamentos indevidos
	- NÃO misture camadas (controller ≠ service ≠ domain)
	- Sempre considerar multi-tenancy
- Backend:
	- Respeite a arquitetura definida (NestJS + Prisma)
	- NÃO altere decisões arquiteturais existentes
	- NÃO crie atalhos ou acoplamentos indevidos
	- NÃO misture camadas (controller ≠ service ≠ domain)
	- Sempre considerar multi-tenancy (tenantId)
- Frontend:
	- Respeite a arquitura definida: Vue 3 + Vuetify + Pinia + Clean Architecture
	- NÃO criar mocks hardcoded
	- NÃO misturar camadas (Presentation / Application / Domain / Infrastructure)
	- Usar stores para estado
	- Usar services/adapters para HTTP

- Se algo não estiver definido, PERGUNTE antes de assumir
- NÃO implementar funcionalidades fora da fase/sprint solicitada
- Criar os testes unitarios
- Para implementação se baseie nos documentos:
   @docs/Features/F1A-Implementation-Plan.md
   @docs/Features/Phase1-Specification-Plan.md

- Caso necessite consulte os documentos da pasta docs

Implemente APENAS a sprint solicitada.

---

Para implementação ler o documento: @docs/Features/F1A-Implementation-Plan.md

***IMPLEMENTAR:**

Implementar: **Sprint 2 - Autenticacao Core**

---
