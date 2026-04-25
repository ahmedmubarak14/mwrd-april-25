import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { webhookProviderEnum } from "./_enums";
import { payments } from "./payment";
import { orders } from "./order";

/**
 * Webhook events — raw payload store for every Moyasar callback.
 * Signature verification happens BEFORE any state mutation. This table is the
 * audit + replay source of truth. Never trust data in this table for
 * application logic unless `signature_verified = true`.
 */
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: webhookProviderEnum("provider").notNull(),
    eventType: text("event_type").notNull(),
    rawPayload: jsonb("raw_payload").notNull(),
    signature: text("signature").notNull(),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    relatedPaymentId: uuid("related_payment_id").references(() => payments.id),
    relatedOrderId: uuid("related_order_id").references(() => orders.id),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("webhook_events_provider_type_received_idx").on(
      t.provider,
      t.eventType,
      sql`${t.receivedAt} desc`,
    ),
    index("webhook_events_signature_verified_idx").on(t.signatureVerified),
    index("webhook_events_processed_idx").on(t.processedAt),
  ],
);
