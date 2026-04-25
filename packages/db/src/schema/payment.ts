import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import {
  paymentMethodEnum,
  paymentPurposeEnum,
  paymentStatusEnum,
} from "./_enums";
import { orders } from "./order";
import { wallets } from "./wallet";

/**
 * Payments — one row per payment event (order payment, wallet top-up, refund).
 * `moyasar_payment_id` is populated for Moyasar-backed methods.
 * `idempotency_key` is the order ID for order payments; a unique ID for top-ups.
 * Enforced unique so repeated calls with the same key don't double-charge.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id),
    walletId: uuid("wallet_id").references(() => wallets.id),
    amountHalalas: integer("amount_halalas").notNull(),
    currency: text("currency").notNull().default("SAR"),
    method: paymentMethodEnum("method").notNull(),
    purpose: paymentPurposeEnum("purpose").notNull(),
    moyasarPaymentId: text("moyasar_payment_id"),
    status: paymentStatusEnum("status").notNull().default("initiated"),
    idempotencyKey: text("idempotency_key").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_moyasar_id_unique")
      .on(t.moyasarPaymentId)
      .where(sql`${t.moyasarPaymentId} is not null`),
    uniqueIndex("payments_idempotency_unique").on(t.idempotencyKey),
    index("payments_order_status_idx").on(t.orderId, t.status),
    index("payments_status_created_idx").on(t.status, t.createdAt),
    check("payments_amount_non_negative", sql`${t.amountHalalas} >= 0`),
    check("payments_currency_sar", sql`${t.currency} = 'SAR'`),
  ],
);

/**
 * Payment attempts — full audit trail for each Moyasar call.
 * `request_payload` must NEVER include PAN or CVV; scrubbing is enforced in
 * `packages/payments`.
 */
export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    requestPayload: jsonb("request_payload").notNull(),
    responsePayload: jsonb("response_payload"),
    httpStatus: integer("http_status"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_attempts_payment_attempt_unique").on(
      t.paymentId,
      t.attemptNumber,
    ),
  ],
);
