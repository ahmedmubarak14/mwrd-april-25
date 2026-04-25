import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function SupplierHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("supplier");
  const common = await getTranslations("common");

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-start justify-center gap-6 px-6 py-24">
      <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent-foreground">
        {common("appName")} · Supplier
      </span>
      <h1 className="text-4xl font-bold text-primary">{t("welcome")}</h1>
    </main>
  );
}
