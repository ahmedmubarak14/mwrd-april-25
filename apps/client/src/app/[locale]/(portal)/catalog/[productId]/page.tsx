import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@mwrd/db/client";
import { ProductCard } from "../_product-card";

type Props = { params: Promise<{ locale: string; productId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, productId } = await params;
    const cookieStore = await cookies();
    const sb = createServerSupabase({
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
    });
    const { data } = await sb
        .from("products")
        .select("name_ar, name_en")
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();
    const name = locale === "ar" ? (data?.name_ar as string) : (data?.name_en as string);
    return { title: name ?? "Product" };
}

export default async function ProductDetailPage({ params }: Props) {
    const { locale, productId } = await params;
    if (!isValidLocale(locale)) notFound();
    setRequestLocale(locale);

    const rtl = locale === "ar";
    const t = await getTranslations({ locale, namespace: "catalog" });

    const cookieStore = await cookies();
    const sb = createServerSupabase({
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
            for (const { name, value, options } of items) {
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            }
        },
    });

    const { data: product } = await sb
        .from("products")
        .select(
            "id, name_ar, name_en, description_ar, description_en, image_urls, unit_ar, unit_en, price_halalas, vat_rate, min_order_qty, max_order_qty, stock_on_hand, sku, vendors(display_name_ar, display_name_en), categories(name_ar, name_en, slug)",
        )
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();

    if (!product) notFound();

    type VendorRow = { display_name_ar: string; display_name_en: string } | null;
    type CategoryRow = { name_ar: string; name_en: string; slug: string } | null;

    const vendor = product.vendors as unknown as VendorRow;
    const category = product.categories as unknown as CategoryRow;
    const images = (product.image_urls as string[]) ?? [];
    const name = rtl ? (product.name_ar as string) : (product.name_en as string);
    const description = rtl
        ? (product.description_ar as string | null)
        : (product.description_en as string | null);
    const unit = rtl ? (product.unit_ar as string) : (product.unit_en as string);
    const vendorName = rtl ? vendor?.display_name_ar : vendor?.display_name_en;
    const categoryName = rtl ? category?.name_ar : category?.name_en;
    const priceHalalas = product.price_halalas as number;
    const vatRate = parseFloat(product.vat_rate as string);
    const vatHalalas = Math.round(priceHalalas * vatRate);
    const priceExVatHalalas = priceHalalas - vatHalalas;

    function formatSar(halalas: number) {
        return new Intl.NumberFormat(rtl ? "ar-SA" : "en-SA", {
            style: "currency",
            currency: "SAR",
            minimumFractionDigits: 2,
        }).format(halalas / 100);
    }

    const cardData = {
        id: product.id as string,
        nameAr: product.name_ar as string,
        nameEn: product.name_en as string,
        imageUrls: images,
        unitAr: product.unit_ar as string,
        unitEn: product.unit_en as string,
        priceHalalas,
        vatRate,
        minOrderQty: product.min_order_qty as number,
        stockOnHand: product.stock_on_hand as number,
        vendorNameAr: vendor?.display_name_ar ?? "",
        vendorNameEn: vendor?.display_name_en ?? "",
    };

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-1.5 text-sm text-tertiary">
                <a href={`/${locale}/catalog`} className="hover:text-primary transition-colors">
                    {t("title")}
                </a>
                {categoryName && (
                    <>
                        <span>/</span>
                        <a
                            href={`/${locale}/catalog?category=${category?.slug ?? ""}`}
                            className="hover:text-primary transition-colors"
                        >
                            {categoryName}
                        </a>
                    </>
                )}
                <span>/</span>
                <span className="text-primary font-medium truncate max-w-[200px]">{name}</span>
            </nav>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Images */}
                <div className="space-y-3">
                    <div className="aspect-square rounded-2xl border border-secondary bg-secondary overflow-hidden">
                        {images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={images[0]}
                                alt={name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full mwrd-gradient opacity-20" />
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.slice(1, 5).map((url, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={i}
                                    src={url}
                                    alt=""
                                    className="h-16 w-16 rounded-lg border border-secondary object-cover shrink-0"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-5">
                    {vendorName && (
                        <p className="text-sm font-medium text-brand-600">{vendorName}</p>
                    )}
                    <h1 className="text-display-sm font-semibold text-primary leading-snug">
                        {name}
                    </h1>

                    {/* Price block */}
                    <div className="rounded-xl border border-secondary bg-secondary/40 p-4 space-y-1">
                        <p className="text-2xl font-bold text-primary">{formatSar(priceHalalas)}</p>
                        <p className="text-xs text-tertiary">
                            {formatSar(priceExVatHalalas)} {t("priceExVat")} +{" "}
                            {formatSar(vatHalalas)} VAT ({Math.round(vatRate * 100)}%)
                        </p>
                    </div>

                    {/* Meta */}
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-tertiary">{t("unit")}</dt>
                        <dd className="font-medium text-primary">{unit}</dd>
                        <dt className="text-tertiary">{t("minOrder")}</dt>
                        <dd className="font-medium text-primary">
                            {product.min_order_qty as number} {unit}
                        </dd>
                    </dl>

                    {/* Add to cart */}
                    <div className="pt-2">
                        <ProductCard product={cardData} locale={locale} />
                    </div>

                    {description && (
                        <div className="pt-2 border-t border-secondary">
                            <p className="text-sm text-secondary-fg leading-relaxed whitespace-pre-line">
                                {description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
