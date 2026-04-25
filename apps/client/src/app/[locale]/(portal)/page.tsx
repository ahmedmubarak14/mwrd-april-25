import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function PortalHome({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("client");
    const common = await getTranslations("common");

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="flex flex-col gap-4">
                <span className="inline-flex w-fit rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                    {common("appName")} · Buyer
                </span>
                <h1 className="text-display-sm font-semibold text-primary">{t("welcome")}</h1>
            </div>
        </div>
    );
}
