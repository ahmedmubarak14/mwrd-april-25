import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { walletTxnTypeEnum } from "./_enums";
import { users, companies } from "./identity";
import { orders } from "./order";

/**
 * Wallets — ONE per company, shared by all members. Confirmed 2026-04-25.
 * Balance is non-negative (enforced by DB); any debit that would make it
 * negative must fail in the service layer before attempting.
 */
export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    balanceHalalas: integer("balance_halalas").notNull().default(0),
    currency: text("currency").notNull().default("SAR"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("wallets_company_unique").on(t.companyId),
    check("wallets_balance_non_negative", sql`${t.balanceHalalas} >= 0`),
    check("wallets_currency_sar", sql`${t.currency} = 'SAR'`),
  ],
);

/**
 * Wallet transactions. `balance_after_halalas` is a snapshot for auditability.
 * `payment_id` links to a `payments` row when the transaction came from a
 * Moyasar top-up or refund (FK added lazily in migration to avoid cyclic deps
 * between wallets and payments — both reference orders).
 */
export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    type: walletTxnTypeEnum("type").notNull(),
    amountHalalas: integer("amount_halalas").notNull(),
    balanceAfterHalalas: integer("balance_after_halalas").notNull(),
    orderId: uuid("order_id").references(() => orders.id),
    paymentId: uuid("payment_id"),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wallet_transactions_wallet_time_idx").on(
      t.walletId,
      sql`${t.createdAt} desc`,
    ),
    index("wallet_transactions_order_idx").on(t.orderId),
    index("wallet_transactions_payment_idx").on(t.paymentId),
    check("wallet_transactions_amount_non_negative", sql`${t.amountHalalas} >= 0`),
    check(
      "wallet_transactions_balance_after_non_negative",
      sql`${t.balanceAfterHalalas} >= 0`,
    ),
  ],
);
