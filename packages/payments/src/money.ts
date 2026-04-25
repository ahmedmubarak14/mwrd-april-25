const HALALAS_PER_SAR = 100;

/**
 * Convert SAR (decimal) to halalas (integer smallest unit).
 * All DB-stored and provider-passed amounts are halalas — never decimals.
 * Rounded via Math.round to avoid floating-point surprises.
 */
export function sarToHalalas(sar: number | string): number {
  const n = typeof sar === "string" ? Number(sar) : sar;
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid SAR amount: ${sar}`);
  }
  return Math.round(n * HALALAS_PER_SAR);
}

export function halalasToSar(halalas: number): number {
  if (!Number.isInteger(halalas)) {
    throw new Error(`halalas must be integer, got: ${halalas}`);
  }
  return halalas / HALALAS_PER_SAR;
}

/**
 * Format halalas as a localized SAR currency string.
 * Arabic uses Arabic-Indic digits by default via ar-SA locale.
 */
export function formatSar(halalas: number, locale: "ar" | "en" = "ar"): string {
  const sar = halalasToSar(halalas);
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(sar);
}

export function sumHalalas(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Compute VAT on a pre-tax amount. Both inputs and outputs are integers (halalas).
 * Banker's-rounding-free: uses Math.round.
 */
export function computeVatHalalas(
  preTaxHalalas: number,
  vatRate: number,
): number {
  if (!Number.isInteger(preTaxHalalas) || preTaxHalalas < 0) {
    throw new Error(`preTaxHalalas must be non-negative integer`);
  }
  if (vatRate < 0 || vatRate > 1) {
    throw new Error(`vatRate must be between 0 and 1, got: ${vatRate}`);
  }
  return Math.round(preTaxHalalas * vatRate);
}
