# Setup

---

## Inicialização das Aplicações


```
Gere a estutura de monorepo no diretorio atual, leve em conta os documentos:
- @docs/Overview/Product.md
- @docs/Architecture/Architecture Overview.md

Inicialize cada aplicacao
No Prisma, ainda nao crie os model em schema.prisma
Nas aplicacoes em vue, use Vue3+Vuetify
Nos servicos de IA use UV como gerenciador de projeto do python, e FastAPI
Nas aplicacoes em Node/Javascript use node_modules e dist por aplicacao, nao use um node_modules global
```

---

## Adicao da descrição das aplicações

```
Adicione no documento @docs/Overview/Product.md, logo apos 'Estrutura de Projeto (Monorepo)' a descrição de cada aplicacao
```


---


## Configuração das portas


```
Configure as portas default das aplicações conforme tabela abaixo:
|Aplicacao|Porta|
|---|---|
|server-api|5100|
|portal-acception|5000|
|portal-solution|5001|
|portal-provider|5002|
|portal-conveniado|5003|
|ia-service|5010|

Torna as portas configuraveis no arquivo .env de cada aplicacao
```



---
## Adição de Launch das aplicações

```
Adicione em .vscode, na raiz do monorepo, um launch para rodar:
  - server-api - em modo debug
  - Todos as aplicacoes do frontend
  - O serviço 'ia-service'
```

---
## Init CLAUDE.md

```
Inicialize o projeto com o CLAUDE.md. Analise o projeto e os documentos:

@docs/Overview/Product.md
@docs/Architecture/Architecture Overview.md
```

__Rodar no Claude Code __


---

# AGENTS.md e CRUSH.md


Adicione links simbolicos para CLAUDE.md

