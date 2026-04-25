import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users, companies } from "./identity";
import { products } from "./catalog";

/**
 * Favourite lists — named reorder templates. `is_shared_with_company` = true
 * exposes the list to all members of the owning company.
 */
export const favouriteLists = pgTable(
  "favourite_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isSharedWithCompany: boolean("is_shared_with_company")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("favourite_lists_company_idx").on(t.companyId),
    index("favourite_lists_user_idx").on(t.userId),
  ],
);

export const favouriteListItems = pgTable(
  "favourite_list_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    favouriteListId: uuid("favourite_list_id")
      .notNull()
      .references(() => favouriteLists.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    defaultQuantity: integer("default_quantity").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("favourite_list_items_list_product_unique").on(
      t.favouriteListId,
      t.productId,
    ),
  ],
);
