import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@mwrd/db/client";
import { ProductCard, type ProductCardData } from "./_product-card";

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ category?: string; q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "catalog" });
    return { title: t("title") };
}

export default async function CatalogPage({ params, searchParams }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();
    setRequestLocale(locale);

    const { category: categorySlug, q } = await searchParams;
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

    // ── Categories ──────────────────────────────────────────────────────────
    const { data: allCategories } = await sb
        .from("categories")
        .select("id, slug, name_ar, name_en, parent_category_id, sort_order")
        .eq("is_active", true)
        .order("sort_order");

    const topCategories = (allCategories ?? []).filter((c) => !c.parent_category_id);

    // Resolve active category id from slug
    const activeCategory = categorySlug
        ? (allCategories ?? []).find((c) => c.slug === categorySlug)
        : null;

    // ── Products ────────────────────────────────────────────────────────────
    let query = sb
        .from("products")
        .select(
            "id, name_ar, name_en, image_urls, unit_ar, unit_en, price_halalas, vat_rate, min_order_qty, stock_on_hand, vendor_id, vendors(display_name_ar, display_name_en)",
        )
        .eq("is_active", true)
        .order("name_en");

    if (activeCategory) {
        query = query.eq("category_id", activeCategory.id as string);
    }

    if (q && q.trim()) {
        // Full-text on search_en (simple) + fallback ilike on both name columns
        query = query.or(
            `name_en.ilike.%${q.trim()}%,name_ar.ilike.%${q.trim()}%`,
        );
    }

    const { data: rawProducts } = await query.limit(60);

    type VendorRow = { display_name_ar: string; display_name_en: string } | null;

    const products: ProductCardData[] = (rawProducts ?? []).map((p) => {
        const vendor = p.vendors as unknown as VendorRow;
        return {
            id: p.id as string,
            nameAr: p.name_ar as string,
            nameEn: p.name_en as string,
            imageUrls: (p.image_urls as string[]) ?? [],
            unitAr: p.unit_ar as string,
            unitEn: p.unit_en as string,
            priceHalalas: p.price_halalas as number,
            vatRate: parseFloat(p.vat_rate as string),
            minOrderQty: p.min_order_qty as number,
            stockOnHand: p.stock_on_hand as number,
            vendorNameAr: vendor?.display_name_ar ?? "",
            vendorNameEn: vendor?.display_name_en ?? "",
        };
    });

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
            <div className="flex gap-8">
                {/* ── Sidebar ──────────────────────────────────────────────── */}
                <aside className="hidden lg:block w-56 shrink-0">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
                        {t("allCategories")}
                    </p>
                    <nav className="space-y-0.5">
                        <a
                            href={`/${locale}/catalog`}
                            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                !activeCategory
                                    ? "bg-brand-50 text-brand-700"
                                    : "text-secondary-fg hover:bg-secondary hover:text-primary"
                            }`}
                        >
                            {t("allCategories")}
                        </a>
                        {topCategories.map((cat) => (
                            <a
                                key={cat.id as string}
                                href={`/${locale}/catalog?category=${cat.slug as string}`}
                                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    activeCategory?.id === cat.id
                                        ? "bg-brand-50 text-brand-700"
                                        : "text-secondary-fg hover:bg-secondary hover:text-primary"
                                }`}
                            >
                                {rtl ? (cat.name_ar as string) : (cat.name_en as string)}
                            </a>
                        ))}
                    </nav>
                </aside>

                {/* ── Main ─────────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0">
                    {/* Search bar */}
                    <form method="get" action={`/${locale}/catalog`} className="mb-6">
                        {categorySlug && (
                            <input type="hidden" name="category" value={categorySlug} />
                        )}
                        <div className="relative">
                            <input
                                type="search"
                                name="q"
                                defaultValue={q}
                                placeholder={t("search")}
                                className="w-full rounded-xl border border-secondary bg-primary px-4 py-2.5 pe-10 text-sm placeholder:text-tertiary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-colors"
                            />
                            <button
                                type="submit"
                                className="absolute end-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
                                aria-label={t("searchLabel")}
                            >
                                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <circle cx="6.5" cy="6.5" r="4.5" />
                                    <path d="M10.5 10.5l3 3" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    </form>

                    {/* Heading */}
                    <div className="mb-5 flex items-baseline gap-2">
                        <h1 className="text-display-xs font-semibold text-primary">
                            {activeCategory
                                ? (rtl
                                    ? (activeCategory.name_ar as string)
                                    : (activeCategory.name_en as string))
                                : t("title")}
                        </h1>
                        <span className="text-sm text-tertiary">({products.length})</span>
                    </div>

                    {/* Products grid */}
                    {products.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-secondary py-20 text-center space-y-1">
                            <p className="font-medium text-primary">{t("noProducts")}</p>
                            <p className="text-sm text-tertiary">{t("noProductsHint")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} locale={locale} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
