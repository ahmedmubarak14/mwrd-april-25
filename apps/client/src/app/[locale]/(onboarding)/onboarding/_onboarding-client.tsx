"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createCompanyAction, requestJoinAction } from "../../../../actions/company";
import { Button } from "@mwrd/ui/components/button";
import { Input } from "@mwrd/ui/components/input";
import { Label } from "@mwrd/ui/components/label";
import { Badge, BadgeDot } from "@mwrd/ui/components/badge";

type Company = { id: string; nameAr: string; nameEn: string; emailDomain: string | null };

type Props = {
    companies: Company[];
    userDomain: string;
    locale: string;
};

// ─── Join request form ───────────────────────────────────────────────────────

function JoinForm({ company, locale }: { company: Company; locale: string }) {
    const t = useTranslations("onboarding");
    const rtl = locale === "ar";
    const companyName = rtl ? company.nameAr : company.nameEn;

    const [state, action, pending] = useActionState(requestJoinAction, null);

    if (state?.success) {
        return (
            <div className="rounded-xl border border-secondary bg-primary p-6 text-center space-y-3 shadow-sm">
                <div className="text-4xl">✅</div>
                <p className="font-semibold text-primary">{t("joinPendingTitle")}</p>
                <p className="text-sm text-tertiary">
                    {t("joinPendingBody", { company: companyName })}
                </p>
            </div>
        );
    }

    const errorMsg =
        state?.success === false
            ? state.error === "already_requested"
                ? t("errorAlreadyRequested")
                : t("errorGeneric")
            : null;

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="companyId" value={company.id} />

            {errorMsg && (
                <div className="rounded-lg border border-error-subtle bg-error-primary px-4 py-3 text-sm text-error-primary">
                    {errorMsg}
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="message">{t("joinMessageLabel")}</Label>
                <Input
                    id="message"
                    name="message"
                    type="text"
                    placeholder={t("joinMessagePlaceholder")}
                />
            </div>

            <Button
                type="submit"
                color="primary"
                size="md"
                className="w-full"
                isDisabled={pending}
                isLoading={pending}
            >
                {t("joinButton")}
            </Button>
        </form>
    );
}

// ─── Create company form ─────────────────────────────────────────────────────

function CreateForm() {
    const t = useTranslations("onboarding");
    const [state, action, pending] = useActionState(createCompanyAction, null);

    const errorMsg =
        state?.success === false
            ? state.error === "invalid_input"
                ? t("errorInvalidInput")
                : state.error === "create_failed"
                  ? t("errorCreateFailed")
                  : state.error === "member_failed"
                    ? t("errorMemberFailed")
                    : t("errorGeneric")
            : null;

    return (
        <form action={action} className="space-y-4">
            {errorMsg && (
                <div className="rounded-lg border border-error-subtle bg-error-primary px-4 py-3 text-sm text-error-primary">
                    {errorMsg}
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="nameAr">{t("nameArLabel")}</Label>
                <Input
                    id="nameAr"
                    name="nameAr"
                    type="text"
                    placeholder={t("nameArPlaceholder")}
                    dir="rtl"
                    required
                    minLength={2}
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="nameEn">{t("nameEnLabel")}</Label>
                <Input
                    id="nameEn"
                    name="nameEn"
                    type="text"
                    placeholder={t("nameEnPlaceholder")}
                    dir="ltr"
                    required
                    minLength={2}
                />
            </div>

            <Button
                type="submit"
                color="primary"
                size="md"
                className="w-full"
                isDisabled={pending}
                isLoading={pending}
            >
                {t("createButton")}
            </Button>
        </form>
    );
}

// ─── Main onboarding client ──────────────────────────────────────────────────

export function OnboardingClient({ companies, userDomain, locale }: Props) {
    const t = useTranslations("onboarding");
    const rtl = locale === "ar";

    const hasMatchingCompanies = companies.length > 0;

    return (
        <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-1">
                <h1 className="text-display-sm font-semibold text-primary">{t("title")}</h1>
                <p className="text-sm text-tertiary">{t("subtitle")}</p>
                {userDomain && (
                    <div className="flex justify-center pt-1">
                        <Badge color="brand" size="sm">
                            <BadgeDot color="brand" />
                            {userDomain}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-secondary bg-primary shadow-sm p-6 space-y-6">
                {hasMatchingCompanies ? (
                    <>
                        <div className="space-y-1">
                            <h2 className="font-semibold text-primary">{t("joinTitle")}</h2>
                            <p className="text-sm text-tertiary">{t("joinSubtitle")}</p>
                        </div>

                        {/* Show each matching company */}
                        <div className="space-y-4">
                            {companies.map((company) => (
                                <div
                                    key={company.id}
                                    className="rounded-xl border border-secondary p-4 space-y-3"
                                >
                                    <div>
                                        <p className="font-medium text-primary">
                                            {rtl ? company.nameAr : company.nameEn}
                                        </p>
                                        <p className="text-sm text-tertiary">
                                            {rtl ? company.nameEn : company.nameAr}
                                        </p>
                                    </div>
                                    <JoinForm company={company} locale={locale} />
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-secondary" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-primary px-3 text-xs text-tertiary">or</span>
                            </div>
                        </div>

                        {/* Also let them create a new one */}
                        <div className="space-y-3">
                            <h2 className="font-semibold text-primary">{t("createTitle")}</h2>
                            <CreateForm />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-1">
                            <h2 className="font-semibold text-primary">{t("createTitle")}</h2>
                            <p className="text-sm text-tertiary">{t("createSubtitle")}</p>
                        </div>
                        <CreateForm />
                    </>
                )}
            </div>
        </div>
    );
}
