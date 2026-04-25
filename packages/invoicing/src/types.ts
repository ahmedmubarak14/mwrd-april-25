import type { InvoiceSeller } from "./config.js";

export interface InvoiceLineItem {
  productNameAr: string;
  productNameEn: string;
  skuSnapshot: string;
  quantity: number;
  unitPriceHalalas: number;
  vatRate: number;
  lineSubtotalHalalas: number;
  lineVatHalalas: number;
  lineTotalHalalas: number;
}

export interface InvoiceBuyer {
  companyId: string;
  nameAr: string;
  nameEn: string;
  vatNumber?: string;
  crNumber?: string;
  address: string;
}

export interface InvoiceInput {
  orderId: string;
  invoiceNumber: string;
  issuedAt: Date;
  buyer: InvoiceBuyer;
  seller: InvoiceSeller;
  lines: InvoiceLineItem[];
  subtotalHalalas: number;
  vatHalalas: number;
  totalHalalas: number;
  currency: "SAR";
}

export interface InvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl: string;
  version: number;
  provider: "standard" | "zatca";
  zatcaUuid?: string;
  zatcaHash?: string;
}

/**
 * Contract every invoice provider must implement.
 * v1:  StandardTaxInvoiceProvider   — bilingual PDF, VAT fields populated.
 * v1.1: ZatcaPhase2Provider          — same interface, ZATCA XML + PDF.
 * Swap is a single-package change controlled by an env flag.
 */
export interface InvoiceProvider {
  readonly name: "standard" | "zatca";
  generateInvoice(input: InvoiceInput): Promise<InvoiceResult>;
  getInvoiceStatus(invoiceId: string): Promise<InvoiceResult>;
  regenerateInvoice(invoiceId: string): Promise<InvoiceResult>;
}
