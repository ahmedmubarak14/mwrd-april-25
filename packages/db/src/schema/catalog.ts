import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  check,
  foreignKey,
  customType,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendor";

/**
 * Postgres `tsvector` — for full-text search on product names/descriptions.
 * Drizzle lacks a native tsvector, so we declare a custom type.
 * The columns are GENERATED via raw SQL in the migration (Drizzle doesn't
 * support generated-column tsvector yet), added in Phase 3b.
 */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

/**
 * Categories — four top-level (stationery, pantry, cleaning, IT consumables)
 * plus ~6–10 subcategories each. Tree via `parent_category_id`.
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentCategoryId: uuid("parent_category_id"),
    slug: text("slug").notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    uniqueIndex("categories_slug_unique").on(t.slug),
    index("categories_parent_idx").on(t.parentCategoryId),
    foreignKey({
      columns: [t.parentCategoryId],
      foreignColumns: [t.id],
      name: "categories_parent_fk",
    }).onDelete("set null"),
  ],
);

/**
 * Products — vendor-scoped SKUs. SKU is unique per vendor (not globally).
 * Prices are halalas INT (integer SAR * 100), never decimals.
 * `search_ar` and `search_en` are generated tsvector columns (defined in SQL
 * migration as `GENERATED ALWAYS AS (to_tsvector('arabic', name_ar || ...))
 * STORED`).
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    sku: text("sku").notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    imageUrls: jsonb("image_urls").notNull().default(sql`'[]'::jsonb`),
    unitAr: text("unit_ar").notNull(),
    unitEn: text("unit_en").notNull(),
    priceHalalas: integer("price_halalas").notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0.1500"),
    minOrderQty: integer("min_order_qty").notNull().default(1),
    maxOrderQty: integer("max_order_qty"),
    stockOnHand: integer("stock_on_hand").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    searchAr: tsvector("search_ar"),
    searchEn: tsvector("search_en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("products_vendor_sku_unique").on(t.vendorId, t.sku),
    index("products_category_active_idx").on(t.categoryId, t.isActive),
    check("products_price_non_negative", sql`${t.priceHalalas} >= 0`),
    check("products_min_order_qty_positive", sql`${t.minOrderQty} >= 1`),
    check("products_vat_rate_bounds", sql`${t.vatRate} >= 0 AND ${t.vatRate} <= 1`),
  ],
);
