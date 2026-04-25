import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { isValidLocale, isRtl } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { Logo } from "@mwrd/ui";

export default async function AuthLayout({
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
