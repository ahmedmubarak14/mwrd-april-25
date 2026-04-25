"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addToCartAction } from "../../../../actions/cart";
import { Button } from "@mwrd/ui/components/button";
import { cx } from "@mwrd/ui/utils/cx";

export type ProductCardData = {
    id: string;
    nameAr: string;
    nameEn: string;
    imageUrls: string[];
    unitAr: string;
    unitEn: string;
    priceHalalas: number;
    vatRate: number;
    minOrderQty: number;
    stockOnHand: number;
    vendorNameAr: string;
    vendorNameEn: string;
};

type Props = { product: ProductCardData; locale: string };

function formatSar(halalas: number, locale: string): string {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
        style: "currency",
        currency: "SAR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(halalas / 100);
}

export function ProductCard({ product, locale }: Props) {
    const t = useTranslations("catalog");
    const rtl = locale === "ar";

    const [state, action, pending] = useActionState(addToCartAction, null);

    const name = rtl ? product.nameAr : product.nameEn;
    const unit = rtl ? product.unitAr : product.unitEn;
    const vendorName = rtl ? product.vendorNameAr : product.vendorNameEn;
    const outOfStock = product.stockOnHand < 1;
    const added = state?.success === true;

    const firstImage = product.imageUrls[0];

    return (
        <div className="group flex flex-col rounded-2xl border border-secondary bg-primary overflow-hidden hover:border-brand-300 hover:shadow-md transition-all">
            {/* Image */}
            <a href={`/${locale}/catalog/${product.id}`} className="block aspect-square bg-secondary overflow-hidden">
                {firstImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={firstImage}
                        alt={name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="h-full w-full mwrd-gradient opacity-30" />
                )}
            </a>

            {/* Details */}
            <div className="flex flex-col gap-2 p-4 flex-1">
                <p className="text-xs text-tertiary truncate">{vendorName}</p>
                <a
                    href={`/${locale}/catalog/${product.id}`}
                    className="text-sm font-medium text-primary line-clamp-2 hover:text-brand-600 transition-colors leading-snug"
                >
                    {name}
                </a>
                <p className="text-xs text-tertiary">{unit}</p>

                <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                    <div>
                        <p className="text-lg font-semibold text-primary">
                            {formatSar(product.priceHalalas, locale)}
                        </p>
                        <p className="text-xs text-tertiary">{t("vatIncluded")}</p>
                    </div>

                    <form action={action}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="qty" value="1" />
                        <Button
                            type="submit"
                            color={added ? "secondary" : "primary"}
                            size="sm"
                            isDisabled={pending || outOfStock || added}
                            isLoading={pending}
                            className={cx(outOfStock && "opacity-50 cursor-not-allowed")}
                        >
                            {outOfStock
                                ? t("outOfStock")
                                : added
                                  ? t("addedToCart")
                                  : t("addToCart")}
                        </Button>
                    </form>
                </div>

                {state?.success === false && (
                    <p className="text-xs text-error-primary">{t("errorAddFailed")}</p>
                )}
            </div>
        </div>
    );
}
