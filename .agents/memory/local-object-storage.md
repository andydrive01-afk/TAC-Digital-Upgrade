---
name: Storage local em disco em vez de Object Storage do Replit
description: Quando e como substituir o Object Storage do Replit (GCS via sidecar) por armazenamento local em disco para uploads
---

Quando o usuário planeja hospedar o app fora do Replit (VPS próprio), a implementação padrão de upload que usa o Object Storage do Replit (`@google-cloud/storage` + sidecar em `127.0.0.1:1106`, env vars `PUBLIC_OBJECT_SEARCH_PATHS`/`PRIVATE_OBJECT_DIR`) não deve ser usada — ela depende de infraestrutura exclusiva do Replit e falha com erro genérico ("Upload failed" / 404) se essas env vars não estiverem configuradas.

**Por quê:** manter a dependência do GCS/sidecar do Replit cria um ponto de falha que não existirá (nem poderá ser configurado) no ambiente de produção final do usuário.

**Como aplicar:**
- Substituir por um serviço simples de storage local em disco (salvar em `<pacote>/uploads/`, servir via rota Express que lê o arquivo do disco).
- Cuidado com `import.meta.dirname` dentro de builds bundlados via esbuild: após o bundle, esse caminho aponta para o diretório de `dist/`, não para `src/`. Prefira `process.cwd()` (que corresponde ao diretório do pacote quando rodado via `pnpm --filter <pkg> run dev/start`) para calcular o caminho de uploads, evitando criar a pasta no lugar errado.
- Adicionar o diretório de uploads ao `.gitignore`.
