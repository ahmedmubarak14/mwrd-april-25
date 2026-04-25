import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isValidLocale, isRtl } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@mwrd/db/client";
import { Logo } from "@mwrd/ui";

export default async function OnboardingLayout({
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

    // Gate: must be authenticated
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

    if (!user) {
        redirect(`/${locale}/signin`);
    }

    // Gate: if already in a company, skip onboarding
    const { data: profile } = await sb
        .from("users")
        .select("active_company_id")
        .eq("id", user.id)
        .single();

    if (profile?.active_company_id) {
        redirect(`/${locale}`);
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-16">
            {/* Brand mark */}
            <div className="mb-10">
                <Logo
                    variant="wordmark"
                    locale={rtl ? "ar" : "en"}
                    wordmarkClassName="h-7"
                />
            </div>

            {children}

            {/* Footer */}
            <p className="mt-10 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} MWRD · مورد
            </p>
        </div>
    );
}
