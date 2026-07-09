---
name: MySQL 8.0 TEXT DEFAULT constraint
description: MySQL 8.0 não permite TEXT/BLOB com DEFAULT não-NULL — use VARCHAR para colunas que precisem de default literal
---

## Regra
No MySQL 8.0, colunas do tipo `TEXT` ou `BLOB` **não podem ter DEFAULT com valor literal** (e.g. `DEFAULT ''`). Isso gera erro 1101 (`ER_BLOB_CANT_HAVE_DEFAULT`). Apenas `DEFAULT NULL` é permitido.

**Why:** Limitação histórica do MySQL que se mantém no 8.0. Não é controlada por `sql_mode`. O `SET SESSION sql_mode = ''` NÃO resolve porque cada `pool.execute()` pode usar uma conexão diferente do pool.

**How to apply:** Nos `CREATE TABLE` do `setup-db` (em `admin.ts`), use `VARCHAR(N)` em vez de `TEXT` para qualquer coluna que precise de `DEFAULT 'valor'`. Escolha N conservador (500–1000). O Drizzle ORM usa `text()` no schema mas isso não afeta os CREATE TABLE manuais — os dois podem divergir em tipo sem problema.

Exemplos corretos:
- `badge VARCHAR(500) NOT NULL DEFAULT ''`
- `image_url VARCHAR(1000) NOT NULL DEFAULT ''`
- `cta_primary VARCHAR(500) NOT NULL DEFAULT 'Ver Planos'`
