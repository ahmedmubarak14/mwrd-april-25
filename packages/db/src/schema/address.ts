import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  timestamp,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { companies } from "./identity";

/**
 * Addresses — buyer-side ship-to addresses. Country is SA-only for MVP.
 * `recipient_name` is the buyer-side name (e.g., "Acme HQ Receiving"); the
 * supplier-visible view REPLACES this with `MWRD Logistics — {supplier_order_number}`
 * via the `supplier_order_items_view` SQL view (Phase 3b).
 */
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    recipientName: text("recipient_name").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    region: text("region").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("SA"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check("addresses_country_sa_only", sql`${t.country} = 'SA'`)],
);

/** Address groups — e.g., "All Riyadh branches". Many-to-many via junction. */
export const addressGroups = pgTable("address_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const addressGroupMembers = pgTable(
  "address_group_members",
  {
    addressGroupId: uuid("address_group_id")
      .notNull()
      .references(() => addressGroups.id, { onDelete: "cascade" }),
    addressId: uuid("address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.addressGroupId, t.addressId] })],
);
