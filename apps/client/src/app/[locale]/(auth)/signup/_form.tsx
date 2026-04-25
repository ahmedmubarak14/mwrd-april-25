"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signUpAction } from "../../../../actions/auth";
import { Button } from "@mwrd/ui/components/button";
import { Input } from "@mwrd/ui/components/input";
import { Label } from "@mwrd/ui/components/label";

type Props = { locale: string };

export function SignUpForm({ locale: _locale }: Props) {
    const t = useTranslations("auth.signup");
    const [state, action, pending] = useActionState(signUpAction, null);

    if (state?.success && state.data?.email) {
        return (
            <div className="rounded-xl border border-secondary bg-primary p-6 text-center space-y-3 shadow-sm">
                <div className="text-4xl">✉️</div>
                <p className="font-semibold text-primary">{t("successTitle")}</p>
                <p className="text-sm text-tertiary">
                    {t("successBody", { email: state.data.email as string })}
                </p>
            </div>
        );
    }

    const errorMsg =
        state?.success === false
            ? state.error === "email_taken"
                ? t("errorEmailTaken")
                : t("errorGeneric")
            : null;

    return (
        <form action={action} className="space-y-4">
            {errorMsg && (
                <div className="rounded-lg border border-error_subtle bg-error-primary px-4 py-3 text-sm text-error-primary">
                    {errorMsg}
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="fullName">{t("fullName")}</Label>
                <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder={t("fullNamePlaceholder")}
                    required
                    minLength={2}
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    required
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("passwordPlaceholder")}
                    required
                    minLength={8}
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
                {t("submit")}
            </Button>
        </form>
    );
}
