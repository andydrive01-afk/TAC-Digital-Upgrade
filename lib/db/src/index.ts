import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// ---------------------------------------------------------------------------
// Lazy / re-initializable pool
// ---------------------------------------------------------------------------
// The pool is created on first use (or when reinitPool is called explicitly).
// This lets the setup wizard configure MYSQL_URL at runtime without a restart.

let _pool: mysql.Pool | null = null;
let _db: MySql2Database<typeof schema> | null = null;

function createPool(url: string) {
  _pool = mysql.createPool(url);
  _db = drizzle(_pool, { schema, mode: "default" });
}

// Initialize from env var at startup if already set
if (process.env["MYSQL_URL"]) {
  createPool(process.env["MYSQL_URL"]);
}

/** Re-initialize the shared pool with a new URL (e.g. after setup wizard). */
export function reinitPool(url: string): void {
  if (_pool) {
    void _pool.end().catch(() => {});
  }
  process.env["MYSQL_URL"] = url;
  createPool(url);
}

// Proxy exports — forward every property access to the live instance so
// existing callers can keep using `pool` and `db` directly.
export const pool = new Proxy({} as mysql.Pool, {
  get(_t, prop) {
    if (!_pool) throw new Error("Database not initialized. Configure MYSQL_URL first.");
    return (_pool as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as mysql.Pool;

export const db = new Proxy({} as MySql2Database<typeof schema>, {
  get(_t, prop) {
    if (!_db) throw new Error("Database not initialized. Configure MYSQL_URL first.");
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as MySql2Database<typeof schema>;

export * from "./schema";
