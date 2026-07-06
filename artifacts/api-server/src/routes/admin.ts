import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
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
    const [row] = await db.insert(heroes).values(body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/heroes/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof heroes.$inferInsert>;
    const [row] = await db.update(heroes).set(body).where(eq(heroes.id, id)).returning();
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
    const [row] = await db.insert(plans).values(body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/plans/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof plans.$inferInsert>;
    const [row] = await db.update(plans).set(body).where(eq(plans.id, id)).returning();
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
    const [row] = await db.insert(coverageCities).values(body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/cities/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof coverageCities.$inferInsert>;
    const [row] = await db.update(coverageCities).set(body).where(eq(coverageCities.id, id)).returning();
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
    const [row] = await db.insert(bonusProducts).values(body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

router.put("/admin/bonus-products/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const body = req.body as Partial<typeof bonusProducts.$inferInsert>;
    const [row] = await db.update(bonusProducts).set(body).where(eq(bonusProducts.id, id)).returning();
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
        .onConflictDoUpdate({ target: siteConfig.key, set: { value, updatedAt: new Date() } });
    }
    res.json({ ok: true });
  } catch (err) { req.log.error({ err }); res.status(500).json({ error: "Erro interno" }); }
});

export default router;
