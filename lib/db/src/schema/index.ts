import { pgTable, text, integer, boolean, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const heroes = pgTable("heroes", {
  id: serial("id").primaryKey(),
  badge: text("badge").notNull().default(""),
  title: text("title").notNull(),
  titleHighlight: text("title_highlight").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  ctaPrimary: text("cta_primary").notNull().default("Ver Planos"),
  ctaPrimaryHref: text("cta_primary_href").notNull().default("/#planos"),
  ctaSecondary: text("cta_secondary").notNull().default("Consultar Cobertura"),
  ctaSecondaryHref: text("cta_secondary_href").notNull().default("/#cobertura"),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const InsertHero = createInsertSchema(heroes);
export const SelectHero = createSelectSchema(heroes);
export type Hero = typeof heroes.$inferSelect;
export type InsertHeroType = typeof heroes.$inferInsert;

export const bonusProducts = pgTable("bonus_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  alt: text("alt").notNull().default(""),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const InsertBonusProduct = createInsertSchema(bonusProducts);
export const SelectBonusProduct = createSelectSchema(bonusProducts);
export type BonusProduct = typeof bonusProducts.$inferSelect;
export type InsertBonusProductType = typeof bonusProducts.$inferInsert;

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  tab: text("tab").notNull().default("fibra"),
  name: text("name").notNull(),
  speed: text("speed").notNull().default(""),
  price: text("price").notNull(),
  priceCents: text("price_cents").notNull().default("90"),
  badge: text("badge").notNull().default(""),
  isFeatured: boolean("is_featured").notNull().default(false),
  icons: jsonb("icons").$type<string[]>().notNull().default([]),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  bonusIds: jsonb("bonus_ids").$type<number[]>().notNull().default([]),
  planKey: text("plan_key").notNull().unique(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const InsertPlan = createInsertSchema(plans);
export const SelectPlan = createSelectSchema(plans);
export type Plan = typeof plans.$inferSelect;
export type InsertPlanType = typeof plans.$inferInsert;

export const coverageCities = pgTable("coverage_cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  state: text("state").notNull().default("SC"),
  active: boolean("active").notNull().default(true),
  order: integer("order").notNull().default(0),
});

export const InsertCoverageCity = createInsertSchema(coverageCities);
export type CoverageCity = typeof coverageCities.$inferSelect;

export const siteConfig = pgTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SiteConfigRow = typeof siteConfig.$inferSelect;
