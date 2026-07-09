---
name: JWT admin authentication
description: How the multi-user JWT auth system works in TAC Telecom api-server
---

Auth was migrated from single `ADMIN_PASSWORD` env var to multi-user JWT flow.

**Token minting:** `jwtSign(username)` in `artifacts/api-server/src/routes/setup.ts` (exported). Signs `{ username, role: "admin" }` with `SESSION_SECRET`, 30-day expiry. Used by both `POST /api/setup/init` and `POST /api/admin/login`.

**Token verification:** `adminAuth` middleware in `artifacts/api-server/src/middlewares/adminAuth.ts`. Reads `Authorization: Bearer <token>`, calls `jwt.verify()`, then checks `payload.role === "admin"`.

**SESSION_SECRET:** checked at startup in `artifacts/api-server/src/index.ts` — server exits immediately if not set. No fallback string is ever used.

**Why no fallback:** a hardcoded fallback secret allows anyone who knows it to mint valid admin JWTs. Fail-fast at startup is the correct pattern.

**How to apply:** always set SESSION_SECRET as a Replit secret before starting the api-server. In production, rotate if it was ever leaked or unset.

**Users table:** `admin_users` in MySQL — `id`, `username VARCHAR(100) UNIQUE`, `password_hash VARCHAR(255)`, `created_at`. bcrypt rounds=12.

**Delete guard:** atomic SQL subquery pattern — `DELETE ... WHERE id=? AND (SELECT COUNT(*) FROM (SELECT id FROM admin_users) t) > 1`. Prevents last-admin deletion without TOCTOU race.
