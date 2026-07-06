import { Router, type IRouter } from "express";
import { db, pool } from "@workspace/db";
import { heroes, plans, coverageCities, siteConfig, bonusProducts } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { adminAuth } from "../middlewares/adminAuth.js";
import { seedDefaultData } from "../lib/seed.js";

const router: IRouter = Router();

router.post("/admin/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "tac-admin-2025";
  if (password === adminPassword) {
    res.json({ token: adminPassword });
    return;
  }
  res.status(401).json({ error: "Senha incorreta" });
});

// ── SETUP DB ─────────────────────────────────────────────────────────
router.post("/admin/setup-db", adminAuth, async (req, res) => {
  try {
    const statements = [
      `CREATE TABLE IF NOT EXISTS heroes (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        badge TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        title_highlight TEXT NOT NULL DEFAULT '',
        subtitle TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        cta_primary TEXT NOT NULL DEFAULT 'Ver Planos',
        cta_primary_href TEXT NOT NULL DEFAULT '/#planos',
        cta_secondary TEXT NOT NULL DEFAULT 'Consultar Cobertura',
        cta_secondary_href TEXT NOT NULL DEFAULT '/#cobertura',
        \`order\` INT NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS bonus_products (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        alt TEXT NOT NULL DEFAULT '',
        \`order\` INT NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS plans (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tab TEXT NOT NULL DEFAULT 'fibra',
        name TEXT NOT NULL DEFAULT '',
        speed TEXT NOT NULL DEFAULT '',
        price TEXT NOT NULL DEFAULT '',
        price_cents TEXT NOT NULL DEFAULT '90',
        badge TEXT NOT NULL DEFAULT '',
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
        state TEXT NOT NULL DEFAULT 'SC',
        active TINYINT(1) NOT NULL DEFAULT 1,
        \`order\` INT NOT NULL DEFAULT 0,
        UNIQUE KEY uq_city_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS site_config (
        \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ];

    const results: string[] = [];
    for (const sql of statements) {
      await pool.execute(sql);
      const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match) results.push(match[1]);
    }

    res.json({ ok: true, tables: results, message: "Banco de dados instalado com sucesso!" });
  } catch (err) {
    req.log.error({ err }, "setup-db error");
    res.status(500).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// ── HEROES ──────────────────────────────────────────────────────────
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
    const id = Number(req.params["id"]);
    await db.delete(heroes).where(eq(heroes.id, id));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── PLANS ────────────────────────────────────────────────────────────
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
    const id = Number(req.params["id"]);
    await db.delete(plans).where(eq(plans.id, id));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── CITIES ───────────────────────────────────────────────────────────
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
    const id = Number(req.params["id"]);
    await db.delete(coverageCities).where(eq(coverageCities.id, id));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── BONUS PRODUCTS ───────────────────────────────────────────────────
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
    const id = Number(req.params["id"]);
    await db.delete(bonusProducts).where(eq(bonusProducts.id, id));
    res.status(204).end();
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

// ── CONFIG ───────────────────────────────────────────────────────────
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
      await db
        .insert(siteConfig)
        .values({ key, value })
        .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
    }
    res.json({ ok: true });
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

export default router;
