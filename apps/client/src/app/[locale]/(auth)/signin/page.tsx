import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SignInForm } from "./_form";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const { error } = await searchParams;
  const t = await getTranslations("auth.signin");
  const common = await getTranslations("common");

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {error === "verification_failed" && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("errorInvalid")}
        </div>
      )}

      <SignInForm locale={locale} />

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/signup`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("signupLink")}
        </Link>
      </p>

      <p className="text-center text-sm">
        <Link
          href={`/${locale}/forgot-password`}
          className="text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
        >
          {t("forgotPassword")}
        </Link>
      </p>
    </div>
  );
}
