import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { invoiceProviderEnum } from "./_enums";
import { orders } from "./order";
import { companies } from "./identity";

/**
 * Invoices — immutable snapshot of seller + buyer + totals at issue time.
 * Historical invoices are frozen even if Byan Solutions rebrands or the buyer
 * changes VAT number.
 *
 * ZATCA forward-compat columns (`zatca_uuid`, `zatca_hash`, `zatca_submitted_at`,
 * `zatca_status`) are NULL in v1 (provider = 'standard'). v1.1's
 * ZatcaPhase2Provider populates them without schema change.
 */
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    invoiceNumber: text("invoice_number").notNull(),
    version: integer("version").notNull().default(1),
    isCurrent: boolean("is_current").notNull().default(true),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    provider: invoiceProviderEnum("provider").notNull().default("standard"),
    pdfUrl: text("pdf_url").notNull(),
    // Seller snapshot (immutable)
    sellerNameAr: text("seller_name_ar").notNull(),
    sellerNameEn: text("seller_name_en").notNull(),
    sellerCrNumber: text("seller_cr_number").notNull(),
    sellerVatNumber: text("seller_vat_number").notNull(),
    sellerAddress: text("seller_address").notNull(),
    // Buyer snapshot
    buyerCompanyId: uuid("buyer_company_id")
      .notNull()
      .references(() => companies.id),
    buyerNameAr: text("buyer_name_ar").notNull(),
    buyerNameEn: text("buyer_name_en").notNull(),
    buyerVatNumber: text("buyer_vat_number"),
    buyerCrNumber: text("buyer_cr_number"),
    buyerAddress: text("buyer_address").notNull(),
    // Totals
    subtotalHalalas: integer("subtotal_halalas").notNull(),
    vatHalalas: integer("vat_halalas").notNull(),
    totalHalalas: integer("total_halalas").notNull(),
    currency: text("currency").notNull().default("SAR"),
    // ZATCA Phase 2 forward-compat (populated in v1.1)
    zatcaUuid: text("zatca_uuid"),
    zatcaHash: text("zatca_hash"),
    zatcaSubmittedAt: timestamp("zatca_submitted_at", { withTimezone: true }),
    zatcaStatus: text("zatca_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("invoices_invoice_number_unique").on(t.invoiceNumber),
    uniqueIndex("invoices_order_current_unique")
      .on(t.orderId)
      .where(sql`${t.isCurrent} = true`),
    index("invoices_buyer_company_idx").on(t.buyerCompanyId),
  ],
);
