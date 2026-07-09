---
name: lib/db TypeScript project references
description: After changing schema in lib/db, must rebuild declarations before tsc on api-server
---

The `lib/db` package uses TypeScript project references (`composite: true`, `emitDeclarationOnly: true`). The api-server's `tsconfig.json` uses `"references": [{ "path": "../../lib/db" }]`, so TypeScript resolves types from `lib/db/dist/*.d.ts`, **not** from the source directly.

**Rule:** any time `lib/db/src/schema/index.ts` (or any other db source) changes, run:
```
cd lib/db && pnpm exec tsc --build
```
before running `tsc --noEmit` on the api-server, otherwise `tsc` reports "Module '@workspace/db' has no exported member '...'" even though the source is correct and esbuild succeeds.

**Why:** esbuild bundles from source (works without compiled declarations), but `tsc --noEmit` (type check) uses the project reference output in `lib/db/dist/`.

**How to apply:** add `pnpm --filter db exec tsc --build` to any CI / post-merge step that adds new exports to the db schema.
