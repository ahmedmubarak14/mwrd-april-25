import { pgEnum } from "drizzle-orm/pg-core";

/** Shared Postgres enums used across domain schemas. */

export const localeEnum = pgEnum("locale", ["ar", "en"]);

export const roleScopeEnum = pgEnum("role_scope", ["company", "department"]);

export const joinRequestStatusEnum = pgEnum("join_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const vendorStatusEnum = pgEnum("vendor_status", [
  "pending_verification",
  "active",
  "suspended",
]);

export const vendorUserRoleEnum = pgEnum("vendor_user_role", ["admin", "staff"]);

export const cartStatusEnum = pgEnum("cart_status", [
  "open",
  "submitted_for_approval",
  "converted_to_order",
  "abandoned",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "partially_refunded",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "mada",
  "apple_pay",
  "stc_pay",
  "wallet",
  "po",
  "wallet_topup",
]);

export const paymentPurposeEnum = pgEnum("payment_purpose", [
  "order_payment",
  "wallet_topup",
  "refund",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "initiated",
  "authorized",
  "captured",
  "failed",
  "refunded",
  "partially_refunded",
  "chargeback",
]);

export const walletTxnTypeEnum = pgEnum("wallet_txn_type", [
  "topup",
  "debit_for_order",
  "refund_credit",
  "adjustment_credit",
  "adjustment_debit",
]);

export const returnStatusEnum = pgEnum("return_status", [
  "submitted",
  "approved",
  "rejected",
  "completed",
]);

export const returnReasonEnum = pgEnum("return_reason", [
  "damaged",
  "wrong_item",
  "quality_issue",
  "no_longer_needed",
  "other",
]);

export const refundMethodEnum = pgEnum("refund_method", ["wallet", "original"]);

export const invoiceProviderEnum = pgEnum("invoice_provider", [
  "standard",
  "zatca",
]);

export const webhookProviderEnum = pgEnum("webhook_provider", ["moyasar"]);
