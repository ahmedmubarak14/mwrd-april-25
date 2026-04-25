import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import {
  returnStatusEnum,
  returnReasonEnum,
  refundMethodEnum,
} from "./_enums";
import { users } from "./identity";
import { orders, orderItems } from "./order";

/**
 * Returns — partial or full. On approval, refund routes to Wallet or to
 * the original payment method via Moyasar refund API (Week 10).
 */
export const returns = pgTable(
  "returns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id),
    status: returnStatusEnum("status").notNull().default("submitted"),
    reasonCode: returnReasonEnum("reason_code").notNull(),
    reasonText: text("reason_text"),
    photoUrls: jsonb("photo_urls").notNull().default(sql`'[]'::jsonb`),
    refundMethod: refundMethodEnum("refund_method"),
    refundAmountHalalas: integer("refund_amount_halalas"),
    moyasarRefundId: text("moyasar_refund_id"),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("returns_order_idx").on(t.orderId),
    index("returns_status_idx").on(t.status),
    check(
      "returns_refund_amount_non_negative",
      sql`${t.refundAmountHalalas} is null OR ${t.refundAmountHalalas} >= 0`,
    ),
  ],
);

export const returnItems = pgTable(
  "return_items",
  {
    returnId: uuid("return_id")
      .notNull()
      .references(() => returns.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id),
    quantityReturned: integer("quantity_returned").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.returnId, t.orderItemId] }),
    check("return_items_quantity_positive", sql`${t.quantityReturned} >= 1`),
  ],
);
