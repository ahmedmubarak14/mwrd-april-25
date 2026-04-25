export type PaymentMethod =
  | "card"
  | "mada"
  | "apple_pay"
  | "stc_pay"
  | "wallet"
  | "po"
  | "wallet_topup";

export type PaymentStatus =
  | "initiated"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "chargeback";

export type PaymentPurpose = "order_payment" | "wallet_topup" | "refund";

/**
 * Input to the payment provider. Amounts are always halalas (SAR * 100).
 * `idempotencyKey` must be stable per logical operation (e.g., order.id for order payments)
 * so retries don't double-charge.
 */
export interface CreatePaymentInput {
  amountHalalas: number;
  currency: "SAR";
  method: Exclude<PaymentMethod, "wallet" | "po">;
  idempotencyKey: string;
  description?: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  providerPaymentId: string;
  status: PaymentStatus;
  redirectUrl?: string;
  raw: unknown;
}

export interface RefundInput {
  providerPaymentId: string;
  amountHalalas: number;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: "pending" | "completed" | "failed";
  raw: unknown;
}

export interface WebhookEvent {
  eventType: string;
  providerPaymentId: string;
  status: PaymentStatus;
  raw: unknown;
}

/**
 * Contract every payment provider must implement.
 * v1 implementation is MoyasarProvider (added in Week 7).
 * Swapping providers is a single-package change.
 */
export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
  parseWebhook(rawBody: string): WebhookEvent;
}
