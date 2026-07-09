import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "@workspace/db";

// ── Per-username existence cache ──────────────────────────────────────────────
// Avoids a DB round-trip on every protected request while still allowing
// near-immediate revocation when an account is explicitly deleted.
const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
  exists: boolean;
  expiresAt: number;
}

const userCache = new Map<string, CacheEntry>();

/** Call after deleting an admin user so the next request is blocked immediately. */
export function invalidateUserCache(username: string): void {
  userCache.delete(username);
}

async function userExists(username: string): Promise<boolean> {
  const now = Date.now();
  const cached = userCache.get(username);
  if (cached && cached.expiresAt > now) return cached.exists;

  const [rows] = await pool.execute(
    "SELECT 1 FROM admin_users WHERE username = ? LIMIT 1",
    [username],
  ) as unknown as [unknown[]];

  const exists = rows.length > 0;
  userCache.set(username, { exists, expiresAt: now + CACHE_TTL_MS });
  return exists;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  const secret = process.env["SESSION_SECRET"];
  if (!secret) {
    req.log.error("SESSION_SECRET is not set — cannot verify admin token");
    res.status(500).json({ error: "Configuração de segurança ausente no servidor." });
    return;
  }

  let payload: { username?: string; role?: string };
  try {
    payload = jwt.verify(token, secret) as { username?: string; role?: string };
  } catch {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  if (payload.role !== "admin" || !payload.username) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  try {
    if (!(await userExists(payload.username))) {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "adminAuth: failed to verify user existence");
    res.status(500).json({ error: "Erro interno ao verificar autenticação." });
    return;
  }

  next();
}
