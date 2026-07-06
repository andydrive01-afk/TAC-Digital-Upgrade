# TAC Telecom

Site institucional de internet/telecom (TAC Telecom) — apresenta planos, cobertura e conteúdo editável via painel admin.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — roda o servidor de API
- `pnpm --filter @workspace/tac-telecom run dev` — roda o site (frontend)
- `pnpm run typecheck` — typecheck completo de todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenera hooks de API e schemas Zod a partir do spec OpenAPI
- `pnpm --filter @workspace/db run push` — aplica alterações de schema no DB (apenas dev)
- Required env: `MYSQL_URL` — string de conexão MySQL (ex: `mysql://user:senha@host:3306/dbname`)
  - **Não usar `DATABASE_URL`**: essa variável é gerenciada automaticamente pelo Replit para o Postgres provisionado e não pode ser sobrescrita pelo app.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: MySQL 8 + Drizzle ORM (`drizzle-orm/mysql2`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Upload de arquivos: armazenamento local em disco (`artifacts/api-server/uploads/`), servido via `GET /api/storage/objects/*`

## Where things live

- `lib/db/src/schema/index.ts` — schema MySQL (heroes, plans, coverageCities, siteConfig, bonusProducts)
- `lib/db/src/index.ts` e `lib/db/drizzle.config.ts` — conexão MySQL (lê `MYSQL_URL`)
- `artifacts/api-server/src/routes/admin.ts` — rotas admin (db-status, setup-db, CRUD)
- `artifacts/api-server/src/routes/storage.ts` — upload/download de arquivos (armazenamento local)
- `artifacts/api-server/src/lib/localObjectStorage.ts` — implementação do storage local em disco
- `artifacts/tac-telecom/src/pages/AdminPage.tsx` — painel admin do site

## Architecture decisions

- **MySQL em vez de Postgres do Replit**: o usuário vai hospedar o projeto em VPS próprio no futuro e quer usar MySQL desde já. O Postgres auto-provisionado do Replit (`DATABASE_URL`) não é usado pelo app; ele usa `MYSQL_URL` apontando para um MySQL 8.0 local (rodando via workflow, Nix `mysql80`) apenas para desenvolvimento/teste no Replit.
- **MariaDB foi descartado**: instalação do MariaDB falha de forma consistente no sandbox atual do Replit (crash em syscalls durante `mariadb-install-db`). MySQL 8.0 funciona normalmente.
- **Storage local em disco em vez de Google Cloud Storage**: a implementação original usava o Object Storage do Replit (GCS via sidecar), que depende de infraestrutura exclusiva do Replit. Como o usuário pretende hospedar em VPS próprio, o upload foi reescrito para salvar arquivos em disco local (`artifacts/api-server/uploads/`), sem dependência de nenhum serviço externo do Replit.

## Product

Site com página inicial (hero, planos de internet, cobertura por cidade, produtos bônus) e um painel admin (`/admin`) para editar esse conteúdo, incluindo upload de imagens.

## User preferences

- Usuário quer usar MySQL (não Postgres), pois pretende hospedar em VPS próprio futuramente.
- Prefere manter conteúdo dummy/exemplo cadastrado no banco para editar depois pelo painel admin.

## Gotchas

- O MySQL local roda como workflow separado ("MySQL", comando `mysqld`). Se o workflow "MySQL" não estiver rodando, todas as rotas que dependem do banco falham silenciosamente — sempre confira `/api/admin/db-status` após reiniciar o ambiente.
- Nunca usar `DATABASE_URL` no código — é reservada/gerenciada pelo Replit para Postgres. Use sempre `MYSQL_URL`.
- Uploads ficam em `artifacts/api-server/uploads/` (fora do controle de versão). Ao migrar para o VPS, esse diretório precisa existir e ter permissão de escrita, ou os uploads devem ser redirecionados para um volume persistente.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
