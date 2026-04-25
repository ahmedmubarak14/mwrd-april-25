"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signInAction } from "../../../../actions/auth";
import { Button } from "@mwrd/ui/components/button";
import { Input } from "@mwrd/ui/components/input";
import { Label } from "@mwrd/ui/components/label";

type Props = { locale: string };

export function SignInForm({ locale: _locale }: Props) {
    const t = useTranslations("auth.signin");
    const [state, action, pending] = useActionState(signInAction, null);

    const errorMsg =
        state?.success === false
            ? state.error === "invalid_credentials" || state.error === "invalid_input"
                ? t("errorInvalid")
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
                    autoComplete="current-password"
                    placeholder={t("passwordPlaceholder")}
                    required
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
