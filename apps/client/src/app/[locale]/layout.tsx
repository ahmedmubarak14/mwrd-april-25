import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, isRtl, isValidLocale } from "@mwrd/i18n/routing";
import { LocaleAttributes } from "../_locale-attributes";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const rtl = isRtl(locale);

  return (
    <>
      {/* Stamps lang/dir/bodyClass on the root <html>/<body> at runtime */}
      <LocaleAttributes
        locale={locale}
        dir={rtl ? "rtl" : "ltr"}
        bodyClass={rtl ? "font-arabic" : "font-sans"}
      />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </>
  );
}
