import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@mwrd/db/client";
import { CartClient, type CartGroup, type CartLineItem } from "./_cart-client";
import { Button } from "@mwrd/ui";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "cart" });
    return { title: t("title") };
}

export default async function CartPage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();
    setRequestLocale(locale);

    const t = await getTranslations({ locale, namespace: "cart" });

    const cookieStore = await cookies();
    const sb = createServerSupabase({
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
            for (const { name, value, options } of items) {
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            }
        },
    });

    const {
        data: { user },
    } = await sb.auth.getUser();
    if (!user) notFound();

    // Fetch all open carts with items + product + vendor info
    const { data: carts } = await sb
        .from("carts")
        .select(
            `id,
             vendors(display_name_ar, display_name_en),
             cart_items(
               id,
               quantity,
               unit_price_halalas_snapshot,
               products(
                 id, name_ar, name_en, image_urls,
                 unit_ar, unit_en, vat_rate
               )
             )`,
        )
        .eq("status", "open")
        .order("created_at");

    type ProductRow = {
        id: string;
        name_ar: string;
        name_en: string;
        image_urls: string[];
        unit_ar: string;
        unit_en: string;
        vat_rate: string;
    } | null;
    type CartItemRow = {
        id: string;
        quantity: number;
        unit_price_halalas_snapshot: number;
        products: ProductRow;
    };
    type VendorRow = { display_name_ar: string; display_name_en: string } | null;
    type CartRow = { id: string; vendors: VendorRow; cart_items: CartItemRow[] };

    const groups: CartGroup[] = ((carts ?? []) as unknown as CartRow[])
        .filter((cart) => cart.cart_items.length > 0)
        .map((cart) => {
            const vendor = cart.vendors;
            const items: CartLineItem[] = cart.cart_items
                .filter((ci) => ci.products !== null)
                .map((ci) => {
                    const p = ci.products!;
                    return {
                        itemId: ci.id,
                        productId: p.id,
                        productNameAr: p.name_ar,
                        productNameEn: p.name_en,
                        productImageUrl: p.image_urls?.[0] ?? null,
                        unitAr: p.unit_ar,
                        unitEn: p.unit_en,
                        quantity: ci.quantity,
                        unitPriceHalalas: ci.unit_price_halalas_snapshot,
                        vatRate: parseFloat(p.vat_rate),
                    };
                });

            return {
                cartId: cart.id,
                vendorNameAr: vendor?.display_name_ar ?? "",
                vendorNameEn: vendor?.display_name_en ?? "",
                items,
            };
        });

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
            <h1 className="text-display-xs font-semibold text-primary">{t("title")}</h1>

            {groups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-secondary py-20 text-center space-y-3">
                    <p className="font-medium text-primary">{t("empty")}</p>
                    <p className="text-sm text-tertiary">{t("emptyHint")}</p>
                    <div className="pt-2">
                        <Button color="primary" size="sm">
                            <a href={`/${locale}/catalog`}>{t("browseCatalog")}</a>
                        </Button>
                    </div>
                </div>
            ) : (
                <CartClient groups={groups} locale={locale} />
            )}
        </div>
    );
}
