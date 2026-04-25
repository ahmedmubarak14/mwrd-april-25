import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users, companies } from "./identity";
import { orders } from "./order";

/**
 * Analytics tags — cost-center / project free-text tags defined per company.
 * Applied to orders for slicing. MVP is tag storage only; the spend dashboard
 * is deferred to v1.1.
 */
export const analyticsTags = pgTable(
  "analytics_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("analytics_tags_company_name_active_unique")
      .on(t.companyId, t.name)
      .where(sql`${t.isActive} = true`),
  ],
);

export const orderTags = pgTable(
  "order_tags",
  {
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => analyticsTags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.tagId] })],
);
