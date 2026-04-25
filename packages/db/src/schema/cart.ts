import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { cartStatusEnum } from "./_enums";
import { users, companies } from "./identity";
import { vendors } from "./vendor";
import { products } from "./catalog";
import { addresses } from "./address";

/**
 * Carts — one OPEN cart per (user, company, vendor). Matches Lawazem's
 * "separate cart per vendor" UX. Enforced via partial unique index.
 */
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id),
    status: cartStatusEnum("status").notNull().default("open"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("carts_open_per_user_company_vendor_unique")
      .on(t.userId, t.companyId, t.vendorId)
      .where(sql`${t.status} = 'open'`),
  ],
);

/**
 * Cart items. Unit price snapshotted at add-to-cart time so price drift
 * between browse and checkout doesn't silently change the total.
 * `destination_address_id` is null by default; set on multi-address split.
 */
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPriceHalalasSnapshot: integer("unit_price_halalas_snapshot").notNull(),
    destinationAddressId: uuid("destination_address_id").references(
      () => addresses.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("cart_items_cart_product_dest_unique").on(
      t.cartId,
      t.productId,
      t.destinationAddressId,
    ),
    check("cart_items_quantity_positive", sql`${t.quantity} >= 1`),
  ],
);
