**Status:** Accepted
**Contexto:** ML tabular/anomalia e explainability são mais maduros em Python; reduzir acoplamento e risco.
**Decisão:** Serviço Python/FastAPI consumido via API; IA não acessa DB; NestJS envia features e faz fallback.
**Consequências:**

* (+) acelera IA e mantém core protegido
* (+) governança de modelos mais simples
* (–) aumenta complexidade de observabilidade e latência (mitigada por timeout/fallback)