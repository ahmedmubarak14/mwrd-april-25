import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: "portal.nav" });

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-4">
            <h1 className="text-display-xs font-semibold text-primary">{t("settings")}</h1>

            <div className="grid gap-2">
                <a
                    href={`/${locale}/settings/join-requests`}
                    className="flex items-center justify-between rounded-xl border border-secondary bg-primary px-4 py-3 hover:bg-secondary transition-colors"
                >
                    <span className="text-sm font-medium text-primary">Join Requests</span>
                    <svg className="h-4 w-4 text-tertiary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M6 12l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </a>
            </div>
        </div>
    );
}
