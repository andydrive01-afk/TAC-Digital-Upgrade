import { Router, type IRouter } from "express";
import { db, pool } from "@workspace/db";
import {
  heroes, plans, coverageCities, siteConfig, bonusProducts, apps, stores, adminUsers,
} from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { adminAuth, invalidateUserCache } from "../middlewares/adminAuth.js";
import { seedDefaultData } from "../lib/seed.js";
import { jwtSign } from "./setup.js";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username?.trim() || !password) {
    res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    return;
  }
  try {
    const [rows] = await pool.execute(
      "SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1",
      [username.trim()],
    ) as unknown as [{ id: number; username: string; password_hash: string }[]];

    const user = rows?.[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: "Usuário ou senha incorretos." });
      return;
    }
    res.json({ token: jwtSign(user.username) });
  } catch (err) {
    req.log.error({ err }, "login error");
    res.status(500).json({ error: "Erro interno." });
  }
});

// ── SETUP DB (legacy — keeps creating tables idempotently) ────────────────────
router.post("/admin/setup-db", adminAuth, async (req, res) => {
  try {
    // TEXT columns cannot have non-null defaults in MySQL 8 — see memory note mysql-text-default.md
    const statements = [
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

    const results: string[] = [];
    for (const sql of statements) {
      await pool.execute(sql);
      const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match) results.push(match[1]);
    }
    await seedDefaultData();
    res.json({ ok: true, tables: results, message: "Banco instalado e dados padrão carregados!" });
  } catch (err) {
    req.log.error({ err }, "setup-db error");
    res.status(500).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// ── DB STATUS ─────────────────────────────────────────────────────────────────
router.get("/admin/db-status", adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('heroes','plans','coverage_cities','site_config','bonus_products','apps','stores','admin_users')",
    ) as unknown as [{ cnt: number }[]];
    const tableCount = Number(rows?.[0]?.cnt ?? 0);
    res.json({ ok: true, ready: tableCount === 8, tableCount });
  } catch {
    res.json({ ok: true, ready: false, tableCount: 0 });
  }
});

// ── USERS ─────────────────────────────────────────────────────────────────────
router.get("/admin/users", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select({ id: adminUsers.id, username: adminUsers.username, createdAt: adminUsers.createdAt })
      .from(adminUsers)
      .orderBy(asc(adminUsers.id));
    res.json(rows);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.post("/admin/users", adminAuth, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username?.trim() || !password || password.length < 6) {
    res.status(400).json({ error: "Usuário e senha (mínimo 6 caracteres) são obrigatórios." });
    return;
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await db.insert(adminUsers).values({ username: username.trim(), passwordHash: hash });
    const [row] = await db
      .select({ id: adminUsers.id, username: adminUsers.username, createdAt: adminUsers.createdAt })
      .from(adminUsers)
      .where(eq(adminUsers.id, result[0].insertId));
    // Evict any stale negative-cache entry so the new user can auth immediately.
    invalidateUserCache(username.trim());
    res.status(201).json(row);
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") { res.status(409).json({ error: "Este usuário já existe." }); return; }
    req.log.error({ err }); res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);

    // Fetch username first so we can invalidate the auth cache on success.
    const [userRows] = await pool.execute(
      "SELECT username FROM admin_users WHERE id = ? LIMIT 1",
      [id],
    ) as unknown as [{ username: string }[]];
    const targetUsername = userRows?.[0]?.username;

    // Atomic: only delete if more than one admin exists.
    // Uses a subquery so the count check + delete are a single statement with no TOCTOU gap.
    const [result] = await pool.execute(
      "DELETE FROM admin_users WHERE id = ? AND (SELECT COUNT(*) FROM (SELECT id FROM admin_users) AS t) > 1",
      [id],
    ) as unknown as [{ affectedRows: number }];
    if (result.affectedRows === 0) {
      // Could be: last admin OR id not found — both should 400 from user perspective
      res.status(400).json({ error: "Não é possível remover o único administrador ou o usuário não existe." });
      return;
    }

    // Evict from the auth cache so any in-flight token for this user is rejected immediately.
    if (targetUsername) invalidateUserCache(targetUsername);

    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── EXPORT DB ─────────────────────────────────────────────────────────────────
router.get("/admin/db-export", adminAuth, async (req, res) => {
  try {
    const [heroesData, plansData, citiesData, configData, bonusData, appsData, storesData] =
      await Promise.all([
        db.select().from(heroes).orderBy(asc(heroes.order), asc(heroes.id)),
        db.select().from(plans).orderBy(asc(plans.tab), asc(plans.order), asc(plans.id)),
        db.select().from(coverageCities).orderBy(asc(coverageCities.order), asc(coverageCities.name)),
        db.select().from(siteConfig),
        db.select().from(bonusProducts).orderBy(asc(bonusProducts.order), asc(bonusProducts.id)),
        db.select().from(apps).orderBy(asc(apps.order), asc(apps.id)),
        db.select().from(stores).orderBy(asc(stores.order), asc(stores.id)),
      ]);

    const date = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Disposition", `attachment; filename="tac-telecom-backup-${date}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      heroes: heroesData,
      plans: plansData,
      coverageCities: citiesData,
      siteConfig: configData,
      bonusProducts: bonusData,
      apps: appsData,
      stores: storesData,
    });
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── IMPORT DB ─────────────────────────────────────────────────────────────────
router.post("/admin/db-import", adminAuth, async (req, res) => {
  type ImportData = {
    version?: number;
    heroes?: Record<string, unknown>[];
    plans?: Record<string, unknown>[];
    coverageCities?: Record<string, unknown>[];
    siteConfig?: { key: string; value: string }[];
    bonusProducts?: Record<string, unknown>[];
    apps?: Record<string, unknown>[];
    stores?: Record<string, unknown>[];
  };
  const data = req.body as ImportData;
  if (!data || typeof data !== "object") {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }
  try {
    await db.transaction(async (tx) => {
      // Clear content tables (admin_users is intentionally excluded)
      await tx.delete(heroes);
      await tx.delete(plans);
      await tx.delete(coverageCities);
      await tx.delete(siteConfig);
      await tx.delete(bonusProducts);
      await tx.delete(apps);
      await tx.delete(stores);

      if (data.heroes?.length)       await tx.insert(heroes).values(data.heroes as any);
      if (data.plans?.length)        await tx.insert(plans).values(data.plans as any);
      if (data.coverageCities?.length) await tx.insert(coverageCities).values(data.coverageCities as any);
      if (data.siteConfig?.length) {
        for (const row of data.siteConfig)
          await tx.insert(siteConfig).values({ key: row.key, value: row.value })
            .onDuplicateKeyUpdate({ set: { value: row.value } });
      }
      if (data.bonusProducts?.length) await tx.insert(bonusProducts).values(data.bonusProducts as any);
      if (data.apps?.length)         await tx.insert(apps).values(data.apps as any);
      if (data.stores?.length)       await tx.insert(stores).values(data.stores as any);
    });

    const counts = {
      heroes: data.heroes?.length ?? 0,
      plans: data.plans?.length ?? 0,
      coverageCities: data.coverageCities?.length ?? 0,
      bonusProducts: data.bonusProducts?.length ?? 0,
      apps: data.apps?.length ?? 0,
      stores: data.stores?.length ?? 0,
    };
    res.json({ ok: true, counts });
  } catch (err) {
    req.log.error({ err }, "db-import error");
    res.status(500).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// ── HEROES ────────────────────────────────────────────────────────────────────
router.get("/admin/heroes", adminAuth, async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db.select().from(heroes).orderBy(asc(heroes.order), asc(heroes.id));
    res.json(rows);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.post("/admin/heroes", adminAuth, async (req, res) => {
  try {
    const body = req.body as typeof heroes.$inferInsert;
    const result = await db.insert(heroes).values(body);
    const [row] = await db.select().from(heroes).where(eq(heroes.id, result[0].insertId));
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/heroes/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof heroes.$inferInsert>;
    await db.update(heroes).set(body).where(eq(heroes.id, id));
    const [row] = await db.select().from(heroes).where(eq(heroes.id, id));
    if (!row) { res.status(404).json({ error: "Não encontrado" }); return; }
    res.json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/admin/heroes/:id", adminAuth, async (req, res) => {
  try {
    await db.delete(heroes).where(eq(heroes.id, Number(req.params["id"])));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── PLANS ─────────────────────────────────────────────────────────────────────
router.get("/admin/plans", adminAuth, async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db.select().from(plans).orderBy(asc(plans.tab), asc(plans.order), asc(plans.id));
    res.json(rows);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.post("/admin/plans", adminAuth, async (req, res) => {
  try {
    const body = req.body as typeof plans.$inferInsert;
    const result = await db.insert(plans).values(body);
    const [row] = await db.select().from(plans).where(eq(plans.id, result[0].insertId));
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/plans/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof plans.$inferInsert>;
    await db.update(plans).set(body).where(eq(plans.id, id));
    const [row] = await db.select().from(plans).where(eq(plans.id, id));
    if (!row) { res.status(404).json({ error: "Não encontrado" }); return; }
    res.json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/admin/plans/:id", adminAuth, async (req, res) => {
  try {
    await db.delete(plans).where(eq(plans.id, Number(req.params["id"])));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── CITIES ────────────────────────────────────────────────────────────────────
router.get("/admin/cities", adminAuth, async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db.select().from(coverageCities).orderBy(asc(coverageCities.order), asc(coverageCities.name));
    res.json(rows);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.post("/admin/cities", adminAuth, async (req, res) => {
  try {
    const body = req.body as typeof coverageCities.$inferInsert;
    const result = await db.insert(coverageCities).values(body);
    const [row] = await db.select().from(coverageCities).where(eq(coverageCities.id, result[0].insertId));
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/cities/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof coverageCities.$inferInsert>;
    await db.update(coverageCities).set(body).where(eq(coverageCities.id, id));
    const [row] = await db.select().from(coverageCities).where(eq(coverageCities.id, id));
    if (!row) { res.status(404).json({ error: "Não encontrado" }); return; }
    res.json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/admin/cities/:id", adminAuth, async (req, res) => {
  try {
    await db.delete(coverageCities).where(eq(coverageCities.id, Number(req.params["id"])));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── BONUS PRODUCTS ────────────────────────────────────────────────────────────
router.get("/admin/bonus-products", adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(bonusProducts).orderBy(asc(bonusProducts.order), asc(bonusProducts.id));
    res.json(rows);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.post("/admin/bonus-products", adminAuth, async (req, res) => {
  try {
    const body = req.body as typeof bonusProducts.$inferInsert;
    const result = await db.insert(bonusProducts).values(body);
    const [row] = await db.select().from(bonusProducts).where(eq(bonusProducts.id, result[0].insertId));
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/bonus-products/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof bonusProducts.$inferInsert>;
    await db.update(bonusProducts).set(body).where(eq(bonusProducts.id, id));
    const [row] = await db.select().from(bonusProducts).where(eq(bonusProducts.id, id));
    if (!row) { res.status(404).json({ error: "Não encontrado" }); return; }
    res.json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/admin/bonus-products/:id", adminAuth, async (req, res) => {
  try {
    await db.delete(bonusProducts).where(eq(bonusProducts.id, Number(req.params["id"])));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── APPS ──────────────────────────────────────────────────────────────────────
router.get("/admin/apps", adminAuth, async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db.select().from(apps).orderBy(asc(apps.order), asc(apps.id));
    res.json(rows);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.post("/admin/apps", adminAuth, async (req, res) => {
  try {
    const body = req.body as typeof apps.$inferInsert;
    const result = await db.insert(apps).values(body);
    const [row] = await db.select().from(apps).where(eq(apps.id, result[0].insertId));
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/apps/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof apps.$inferInsert>;
    await db.update(apps).set(body).where(eq(apps.id, id));
    const [row] = await db.select().from(apps).where(eq(apps.id, id));
    if (!row) { res.status(404).json({ error: "Não encontrado" }); return; }
    res.json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/admin/apps/:id", adminAuth, async (req, res) => {
  try {
    await db.delete(apps).where(eq(apps.id, Number(req.params["id"])));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── STORES ────────────────────────────────────────────────────────────────────
router.get("/admin/stores", adminAuth, async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db.select().from(stores).orderBy(asc(stores.order), asc(stores.id));
    res.json(rows);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.post("/admin/stores", adminAuth, async (req, res) => {
  try {
    const body = req.body as typeof stores.$inferInsert;
    const result = await db.insert(stores).values(body);
    const [row] = await db.select().from(stores).where(eq(stores.id, result[0].insertId));
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/stores/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof stores.$inferInsert>;
    await db.update(stores).set(body).where(eq(stores.id, id));
    const [row] = await db.select().from(stores).where(eq(stores.id, id));
    if (!row) { res.status(404).json({ error: "Não encontrado" }); return; }
    res.json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.delete("/admin/stores/:id", adminAuth, async (req, res) => {
  try {
    await db.delete(stores).where(eq(stores.id, Number(req.params["id"])));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── CONFIG ────────────────────────────────────────────────────────────────────
router.get("/admin/config", adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(siteConfig);
    const cfg: Record<string, string> = {};
    for (const r of rows) cfg[r.key] = r.value;
    res.json(cfg);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/config", adminAuth, async (req, res) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await db.insert(siteConfig).values({ key, value })
        .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
    }
    res.json({ ok: true });
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

export default router;
