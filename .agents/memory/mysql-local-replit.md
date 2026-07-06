---
name: MySQL local no Replit (dev)
description: Como rodar MySQL localmente no sandbox do Replit quando o app precisa de MySQL em vez do Postgres auto-provisionado
---

Quando um projeto usa `mysql2`/Drizzle-MySQL mas precisa rodar no Replit apenas para dev/teste (produção será em VPS próprio), instale MySQL local em vez de depender do Postgres auto-provisionado do Replit.

**Por quê:** o Replit auto-provisiona Postgres e expõe a conexão via `DATABASE_URL` — essa variável é runtime-managed e não pode ser sobrescrita pelo app. Um app MySQL nunca deve tentar usar `DATABASE_URL`; crie uma variável própria (ex: `MYSQL_URL`) para a conexão MySQL.

**Como aplicar:**
- MariaDB falha de forma consistente no sandbox do Replit (crash em syscalls durante `mariadb-install-db`), mesmo em múltiplas tentativas. Não perca tempo tentando MariaDB — use o pacote Nix `mysql80` (MySQL 8.0), que instala e inicia normalmente.
- `mysqld` precisa rodar como workflow persistente (processos via `&`/`nohup` na bash tool morrem entre chamadas). Configure um workflow dedicado (ex: "MySQL") com datadir/socket/pid em um diretório do projeto (ex: `.mysql-data/`), bind em `127.0.0.1`, porta 3306.
- Crie um banco e usuário de app dedicados com privilégios completos, e aponte `MYSQL_URL` (via `setEnvVars`) para essa conexão.
- Depois de subir o MySQL, rode `pnpm --filter <pacote-db> run push` para aplicar o schema.
