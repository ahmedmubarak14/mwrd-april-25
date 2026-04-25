import { customAlphabet } from "nanoid";

/**
 * Opaque supplier order number. Cannot be reverse-mapped to the buyer order
 * number. Example: `SO-k7p9n2m4`.
 * 8-char alphabet-limited nanoid — confusables (0, 1, i, l, o) removed.
 */
const supplierNano = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

export function generateSupplierOrderNumber(): string {
  return `SO-${supplierNano()}`;
}

/**
 * Buyer-facing sequential number. Example: `ORD-2026-000042`.
 * Sequence is assigned by the database on insert.
 */
export function formatBuyerOrderNumber(year: number, sequence: number): string {
  return `ORD-${year}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Buyer-visible invoice number. Example: `INV-2026-000042`.
 * Sequence is assigned on invoice generation, independent of order sequence.
 */
export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Supplier-visible shipping label. The supplier sees this string as the
 * delivery recipient — never the buyer company name.
 */
export function shippingRecipientLabel(supplierOrderNumber: string): string {
  return `MWRD Logistics — ${supplierOrderNumber}`;
}
