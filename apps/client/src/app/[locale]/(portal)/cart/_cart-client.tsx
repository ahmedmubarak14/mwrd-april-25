"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { removeCartItemAction, updateCartItemQtyAction } from "../../../../actions/cart";
import { Button } from "@mwrd/ui/components/button";

export type CartLineItem = {
    itemId: string;
    productId: string;
    productNameAr: string;
    productNameEn: string;
    productImageUrl: string | null;
    unitAr: string;
    unitEn: string;
    quantity: number;
    unitPriceHalalas: number;
    vatRate: number;
};

export type CartGroup = {
    cartId: string;
    vendorNameAr: string;
    vendorNameEn: string;
    items: CartLineItem[];
};

function formatSar(halalas: number, locale: string): string {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
        style: "currency",
        currency: "SAR",
        minimumFractionDigits: 2,
    }).format(halalas / 100);
}

// ─── Remove button ────────────────────────────────────────────────────────────

function RemoveButton({ itemId }: { itemId: string }) {
    const t = useTranslations("cart");
    const [, action, pending] = useActionState(removeCartItemAction, null);
    return (
        <form action={action}>
            <input type="hidden" name="itemId" value={itemId} />
            <Button type="submit" color="tertiary-destructive" size="sm" isDisabled={pending} isLoading={pending}>
                {t("remove")}
            </Button>
        </form>
    );
}

// ─── Qty stepper ─────────────────────────────────────────────────────────────

function QtyStepper({ itemId, quantity }: { itemId: string; quantity: number }) {
    const t = useTranslations("cart");
    const [, action, pending] = useActionState(updateCartItemQtyAction, null);

    return (
        <form action={action} className="flex items-center gap-1">
            <input type="hidden" name="itemId" value={itemId} />
            <button
                type="submit"
                name="qty"
                value={String(Math.max(1, quantity - 1))}
                disabled={pending || quantity <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-secondary text-sm font-medium hover:bg-secondary disabled:opacity-40 transition-colors"
            >
                −
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
            <button
                type="submit"
                name="qty"
                value={String(quantity + 1)}
                disabled={pending}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-secondary text-sm font-medium hover:bg-secondary disabled:opacity-40 transition-colors"
            >
                +
            </button>
        </form>
    );
}

// ─── Cart group (one vendor) ──────────────────────────────────────────────────

function CartGroupCard({ group, locale }: { group: CartGroup; locale: string }) {
    const t = useTranslations("cart");
    const rtl = locale === "ar";
    const vendorName = rtl ? group.vendorNameAr : group.vendorNameEn;

    const subtotalHalalas = group.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceHalalas,
        0,
    );
    const avgVatRate = group.items[0]?.vatRate ?? 0.15;
    const vatHalalas = Math.round(subtotalHalalas * avgVatRate);
    const totalHalalas = subtotalHalalas + vatHalalas;

    return (
        <div className="rounded-2xl border border-secondary bg-primary overflow-hidden">
            {/* Vendor header */}
            <div className="border-b border-secondary px-4 py-3 bg-secondary/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-tertiary">
                    {t("vendor")}
                </p>
                <p className="text-sm font-medium text-primary">{vendorName}</p>
            </div>

            {/* Items */}
            <div className="divide-y divide-secondary">
                {group.items.map((item) => {
                    const name = rtl ? item.productNameAr : item.productNameEn;
                    const unit = rtl ? item.unitAr : item.unitEn;
                    const lineTotal = item.quantity * item.unitPriceHalalas;

                    return (
                        <div key={item.itemId} className="flex items-start gap-3 p-4">
                            {/* Image */}
                            <div className="h-14 w-14 shrink-0 rounded-lg border border-secondary overflow-hidden bg-secondary">
                                {item.productImageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.productImageUrl} alt={name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full mwrd-gradient opacity-20" />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <p className="text-sm font-medium text-primary line-clamp-2">{name}</p>
                                <p className="text-xs text-tertiary">{unit}</p>
                                <div className="flex items-center justify-between gap-2 pt-1">
                                    <QtyStepper itemId={item.itemId} quantity={item.quantity} />
                                    <div className="text-end">
                                        <p className="text-sm font-semibold text-primary">
                                            {formatSar(lineTotal, locale)}
                                        </p>
                                        <p className="text-xs text-tertiary">
                                            {formatSar(item.unitPriceHalalas, locale)} / {unit}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Remove */}
                            <RemoveButton itemId={item.itemId} />
                        </div>
                    );
                })}
            </div>

            {/* Vendor subtotal */}
            <div className="border-t border-secondary px-4 py-3 bg-secondary/20 space-y-1">
                <div className="flex justify-between text-sm text-secondary-fg">
                    <span>{t("subtotal")}</span>
                    <span>{formatSar(subtotalHalalas, locale)}</span>
                </div>
                <div className="flex justify-between text-sm text-secondary-fg">
                    <span>{t("vat")}</span>
                    <span>{formatSar(vatHalalas, locale)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-primary pt-1 border-t border-secondary">
                    <span>{t("grandTotal")}</span>
                    <span>{formatSar(totalHalalas, locale)}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Main cart client ─────────────────────────────────────────────────────────

export function CartClient({ groups, locale }: { groups: CartGroup[]; locale: string }) {
    const t = useTranslations("cart");

    const grandTotalHalalas = groups.reduce((sum, group) => {
        const subtotal = group.items.reduce((s, i) => s + i.quantity * i.unitPriceHalalas, 0);
        const vat = Math.round(subtotal * (group.items[0]?.vatRate ?? 0.15));
        return sum + subtotal + vat;
    }, 0);

    return (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
            {/* Cart groups */}
            <div className="flex-1 space-y-4">
                {groups.map((group) => (
                    <CartGroupCard key={group.cartId} group={group} locale={locale} />
                ))}
            </div>

            {/* Order summary */}
            <div className="lg:w-72 shrink-0">
                <div className="sticky top-20 rounded-2xl border border-secondary bg-primary p-5 space-y-4">
                    <h2 className="font-semibold text-primary">{t("grandTotal")}</h2>
                    <p className="text-2xl font-bold text-primary">
                        {formatSar(grandTotalHalalas, locale)}
                    </p>
                    {/* Checkout placeholder — Moyasar integration is Phase 7 */}
                    <Button color="primary" size="lg" className="w-full" isDisabled>
                        {t("checkout")}
                    </Button>
                    <p className="text-center text-xs text-tertiary">Coming in Phase 7</p>
                </div>
            </div>
        </div>
    );
}
