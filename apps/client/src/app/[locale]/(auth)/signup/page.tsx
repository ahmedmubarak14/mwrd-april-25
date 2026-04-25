import { setRequestLocale, getTranslations } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SignUpForm } from "./_form";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("auth.signup");

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <SignUpForm locale={locale} />

      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link
          href={`/${locale}/signin`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("signinLink")}
        </Link>
      </p>
    </div>
  );
}
