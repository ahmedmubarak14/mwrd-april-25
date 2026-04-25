import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { detectCompanyAction } from "../../../../actions/company";
import { OnboardingClient } from "./_onboarding-client";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "onboarding" });
    return { title: t("title") };
}

export default async function OnboardingPage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();
    setRequestLocale(locale);

    // Detect companies matching the user's email domain
    const result = await detectCompanyAction();

    const companies = result.success ? (result.data?.companies ?? []) : [];
    const userDomain = result.success ? (result.data?.userDomain ?? "") : "";

    return (
        <OnboardingClient companies={companies} userDomain={userDomain} locale={locale} />
    );
}
