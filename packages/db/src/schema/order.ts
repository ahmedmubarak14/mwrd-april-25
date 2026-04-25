import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { orderStatusEnum, approvalStatusEnum } from "./_enums";
import { users, companies } from "./identity";
import { vendors } from "./vendor";
import { products } from "./catalog";
import { addresses } from "./address";
import { carts } from "./cart";

/**
 * Orders — ONE physical table. Dual-PO is achieved via two independent,
 * opaque numbers + SQL views (`supplier_orders_view`, `supplier_order_items_view`)
 * defined in Phase 3b. Supplier app queries ONLY the views, never this table.
 *
 * `buyer_order_number`: sequential, buyer-facing, e.g. `ORD-2026-000001`.
 * `supplier_order_number`: opaque hash, supplier-facing, e.g. `SO-k7p9n2m4`.
 *   Cannot be reverse-mapped to buyer.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buyerOrderNumber: text("buyer_order_number").notNull(),
    supplierOrderNumber: text("supplier_order_number").notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    status: orderStatusEnum("status").notNull().default("pending_payment"),
    subtotalHalalas: integer("subtotal_halalas").notNull(),
    vatHalalas: integer("vat_halalas").notNull(),
    totalHalalas: integer("total_halalas").notNull(),
    currency: text("currency").notNull().default("SAR"),
    poFileUrl: text("po_file_url"),
    poNumber: text("po_number"),
    placedAt: timestamp("placed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_buyer_number_unique").on(t.buyerOrderNumber),
    uniqueIndex("orders_supplier_number_unique").on(t.supplierOrderNumber),
    index("orders_company_status_idx").on(t.companyId, t.status),
    index("orders_vendor_status_idx").on(t.vendorId, t.status),
    check("orders_subtotal_non_negative", sql`${t.subtotalHalalas} >= 0`),
    check("orders_vat_non_negative", sql`${t.vatHalalas} >= 0`),
    check("orders_total_non_negative", sql`${t.totalHalalas} >= 0`),
    check("orders_currency_sar", sql`${t.currency} = 'SAR'`),
  ],
);

/**
 * Order items. Values (names, SKU, unit price, VAT rate) snapshotted at
 * checkout time so history is immutable even if the product later changes.
 * `destination_address_id` supports multi-address split within one order.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    productNameArSnapshot: text("product_name_ar_snapshot").notNull(),
    productNameEnSnapshot: text("product_name_en_snapshot").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceHalalas: integer("unit_price_halalas").notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 4 }).notNull(),
    lineSubtotalHalalas: integer("line_subtotal_halalas").notNull(),
    lineVatHalalas: integer("line_vat_halalas").notNull(),
    lineTotalHalalas: integer("line_total_halalas").notNull(),
    destinationAddressId: uuid("destination_address_id").references(
      () => addresses.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    check("order_items_quantity_positive", sql`${t.quantity} >= 1`),
  ],
);

/**
 * Order approvals — pending approval queue.
 * A submission can reference either an open cart (pre-order) or an order
 * (post-submission); at least one is non-null at a time.
 */
export const orderApprovals = pgTable(
  "order_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id").references(() => carts.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id),
    approverId: uuid("approver_id")
      .notNull()
      .references(() => users.id),
    status: approvalStatusEnum("status").notNull().default("pending"),
    reason: text("reason"),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [
    index("order_approvals_approver_status_idx").on(t.approverId, t.status),
    index("order_approvals_cart_idx").on(t.cartId),
    index("order_approvals_order_idx").on(t.orderId),
    check(
      "order_approvals_cart_or_order",
      sql`${t.cartId} is not null OR ${t.orderId} is not null`,
    ),
  ],
);
