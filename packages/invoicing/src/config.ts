/**
 * Registered invoice seller for MWRD v1.
 *
 * Byan Solutions is the legal entity that issues tax invoices on MWRD.
 * MWRD is the platform/trading brand; Byan Solutions is the seller of record
 * (CR + VAT).
 *
 * When ZATCA Phase 2 lands in v1.1 (via ZatcaPhase2Provider), these values feed
 * the ZATCA payload unchanged — no migration, no schema change.
 */
export const INVOICE_SELLER = {
  legalNameAr: "شركة بيان سولووشنز",
  legalNameEn: "Byan Solutions Company",
  crNumber: "7053965591",
  vatNumber: "314709605800003",
  // Physical address to be filled in before pilot (ZATCA mandatory field).
  addressAr: "",
  addressEn: "",
} as const;

export type InvoiceSeller = typeof INVOICE_SELLER;

export const VAT_RATE_DEFAULT = 0.15;

export const INVOICE_NUMBER_PREFIX = "INV";
