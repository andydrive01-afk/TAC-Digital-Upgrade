import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { seedDefaultData } from "../lib/seed.js";
import { invalidateUserCache } from "../middlewares/adminAuth.js";

const router: IRouter = Router();

export function jwtSign(username: string): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return jwt.sign({ username, role: "admin" }, secret, { expiresIn: "30d" });
}

// TEXT columns cannot have non-null defaults in MySQL 8 — use VARCHAR for short fields,
// omit DEFAULT for long TEXT fields (app always provides values on insert).
const ALL_CREATE_STMTS = [
  `CREATE TABLE IF NOT EXISTS heroes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    badge VARCHAR(255) NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    title_highlight VARCHAR(500) NOT NULL DEFAULT '',
    subtitle TEXT NOT NULL,
    image_url TEXT NOT NULL,
    cta_primary VARCHAR(255) NOT NULL DEFAULT 'Ver Planos',
    cta_primary_href VARCHAR(500) NOT NULL DEFAULT '/#planos',
    cta_secondary VARCHAR(255) NOT NULL DEFAULT 'Consultar Cobertura',
    cta_secondary_href VARCHAR(500) NOT NULL DEFAULT '/#cobertura',
    \`order\` INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS bonus_products (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    alt VARCHAR(500) NOT NULL DEFAULT '',
    \`order\` INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS plans (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tab VARCHAR(50) NOT NULL DEFAULT 'fibra',
    name TEXT NOT NULL,
    speed VARCHAR(100) NOT NULL DEFAULT '',
    price TEXT NOT NULL,
    price_cents VARCHAR(20) NOT NULL DEFAULT '90',
    badge VARCHAR(255) NOT NULL DEFAULT '',
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    icons JSON NOT NULL,
    features JSON NOT NULL,
    bonus_ids JSON NOT NULL,
    plan_key VARCHAR(255) NOT NULL,
    \`order\` INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_plan_key (plan_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS coverage_cities (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(10) NOT NULL DEFAULT 'SC',
    active TINYINT(1) NOT NULL DEFAULT 1,
    \`order\` INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_city_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS site_config (
    \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS apps (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    url TEXT NOT NULL,
    \`order\` INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS stores (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(255) NOT NULL DEFAULT '',
    lat VARCHAR(50) NOT NULL DEFAULT '',
    lng VARCHAR(50) NOT NULL DEFAULT '',
    maps_url TEXT NOT NULL,
    \`order\` INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

// ── GET /api/setup/status ────────────────────────────────────────────────────
router.get("/setup/status", async (_req, res) => {
  try {
    await pool.execute("SELECT 1");

    const [tblRows] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'admin_users'",
    ) as unknown as [{ cnt: number }[]];

    if (Number(tblRows?.[0]?.cnt ?? 0) === 0) {
      res.json({ needsSetup: true, dbConnected: true });
      return;
    }

    const [userRows] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM admin_users",
    ) as unknown as [{ cnt: number }[]];

    res.json({ needsSetup: Number(userRows?.[0]?.cnt ?? 0) === 0, dbConnected: true });
  } catch (err) {
    res.json({
      needsSetup: true,
      dbConnected: false,
      error: "Não foi possível conectar ao banco de dados.",
    });
  }
});

// ── POST /api/setup/init ────────────────────────────────────────────────────
router.post("/setup/init", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username?.trim() || !password || password.length < 6) {
    res.status(400).json({ error: "Usuário e senha (mínimo 6 caracteres) são obrigatórios." });
    return;
  }

  try {
    // 1. Create all tables
    for (const stmt of ALL_CREATE_STMTS) {
      await pool.execute(stmt);
    }

    // 2. Seed default content (heroes, plans, cities, config, apps, stores)
    await seedDefaultData();

    // 3. Guard: only allow if no admin users exist yet
    const [existing] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM admin_users",
    ) as unknown as [{ cnt: number }[]];

    if (Number(existing?.[0]?.cnt ?? 0) > 0) {
      res.status(409).json({
        error: "Setup já realizado. Acesse o painel admin para gerenciar usuários.",
      });
      return;
    }

    // 4. Create first admin
    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
      [username.trim(), hash],
    );
    // Evict any stale negative-cache entry so the new admin can auth immediately.
    invalidateUserCache(username.trim());

    res.json({ ok: true, token: jwtSign(username.trim()) });
  } catch (err) {
    (req as any).log?.error?.({ err }, "setup/init error");
    res.status(500).json({ error: "Erro ao inicializar o sistema. Verifique os logs do servidor." });
  }
});

export default router;
