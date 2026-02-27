**Status:** Accepted
**Contexto:** Precisamos entregar rápido, manter custo baixo e ter forte consistência (ledger/autorização).
**Decisão:** Backend em NestJS monolítico modular (bounded contexts) + Clean Architecture.
**Consequências:**

* (+) menor complexidade operacional e transacionalidade mais simples
* (+) mais fácil garantir consistência do ledger
* (–) exige disciplina de modularidade para não virar “big ball of mud”
