import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { heroes, plans, coverageCities, siteConfig, bonusProducts } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { seedDefaultData } from "../lib/seed.js";

const router: IRouter = Router();

router.get("/content/heroes", async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db
      .select()
      .from(heroes)
      .where(eq(heroes.active, true))
      .orderBy(asc(heroes.order), asc(heroes.id));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "content/heroes error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/content/plans", async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db
      .select()
      .from(plans)
      .where(eq(plans.active, true))
      .orderBy(asc(plans.tab), asc(plans.order), asc(plans.id));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "content/plans error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/content/cities", async (req, res) => {
  try {
    await seedDefaultData();
    const rows = await db
      .select()
      .from(coverageCities)
      .where(eq(coverageCities.active, true))
      .orderBy(asc(coverageCities.order), asc(coverageCities.name));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "content/cities error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/content/bonus-products", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(bonusProducts)
      .where(eq(bonusProducts.active, true))
      .orderBy(asc(bonusProducts.order), asc(bonusProducts.id));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "content/bonus-products error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/content/config", async (req, res) => {
  try {
    const rows = await db.select().from(siteConfig);
    const cfg: Record<string, string> = {};
    for (const row of rows) {
      if (row.key !== "admin_password" && row.key !== "google_places_api_key") {
        cfg[row.key] = row.value;
      }
    }
    const apiKeyRow = rows.find(r => r.key === "google_places_api_key");
    cfg["google_configured"] = apiKeyRow && apiKeyRow.value ? "true" : "false";
    res.json(cfg);
  } catch (err) {
    req.log.error({ err }, "content/config error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
