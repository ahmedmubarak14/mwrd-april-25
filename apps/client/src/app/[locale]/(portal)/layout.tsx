import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { isValidLocale, isRtl } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@mwrd/db/client";
import { Logo } from "@mwrd/ui";
import { CompanySwitcher } from "./_company-switcher";
import { signOutAction } from "../../../actions/auth";

export default async function PortalLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();
    setRequestLocale(locale);

    const rtl = isRtl(locale);
    const t = await getTranslations({ locale, namespace: "portal.nav" });
    const tCommon = await getTranslations({ locale, namespace: "common" });

    // ── Auth gate ──────────────────────────────────────────────────────────
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

    if (!user) redirect(`/${locale}/signin`);

    // ── Company gate ───────────────────────────────────────────────────────
    const { data: profile } = await sb
        .from("users")
        .select("active_company_id")
        .eq("id", user.id)
        .single();

    if (!profile?.active_company_id) {
        redirect(`/${locale}/onboarding`);
    }

    // ── Fetch all memberships for the switcher ─────────────────────────────
    // company_members_select_self RLS: user sees their own memberships.
    // We join to companies via a separate query since Supabase JS client
    // doesn't support multi-table joins through RLS views easily.
    const { data: memberships } = await sb
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_active", true);

    const companyIds = (memberships ?? []).map((m) => m.company_id as string);

    const { data: companiesData } = await sb
        .from("companies")
        .select("id, name_ar, name_en")
        .in("id", companyIds.length > 0 ? companyIds : ["00000000-0000-0000-0000-000000000000"]);

    type Company = { id: string; nameAr: string; nameEn: string };

    const companies: Company[] = (companiesData ?? []).map((c) => ({
        id: c.id as string,
        nameAr: c.name_ar as string,
        nameEn: c.name_en as string,
    }));

    const tCart = await getTranslations({ locale, namespace: "cart" });

    const navLinks = [
        { href: `/${locale}`, label: t("home") },
        { href: `/${locale}/catalog`, label: t("catalog") },
        { href: `/${locale}/cart`, label: tCart("title") },
        { href: `/${locale}/orders`, label: t("orders") },
        { href: `/${locale}/settings`, label: t("settings") },
    ];

    return (
        <div className="flex min-h-screen flex-col">
            {/* ── Top nav ─────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 border-b border-secondary bg-primary/95 backdrop-blur-sm">
                <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
                    {/* Logo */}
                    <a href={`/${locale}`} className="shrink-0">
                        <Logo
                            variant="icon"
                            iconClassName="h-7 w-7"
                        />
                    </a>

                    {/* Nav links — desktop */}
                    <nav className="hidden sm:flex items-center gap-1 flex-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-fg hover:bg-secondary hover:text-primary transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex-1 sm:flex-none" />

                    {/* Company switcher */}
                    <CompanySwitcher
                        companies={companies}
                        activeCompanyId={profile.active_company_id}
                        locale={locale}
                    />

                    {/* Sign out */}
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-fg hover:bg-secondary hover:text-primary transition-colors"
                        >
                            {tCommon("signOut")}
                        </button>
                    </form>
                </div>
            </header>

            {/* ── Page content ────────────────────────────────────────────────── */}
            <main className="flex-1">{children}</main>
        </div>
    );
}
