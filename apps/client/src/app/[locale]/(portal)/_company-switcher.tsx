"use client";

import { useTransition, useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { switchCompanyAction } from "../../../actions/company";
import { Badge } from "@mwrd/ui/components/badge";
import { cx } from "@mwrd/ui/utils/cx";

type Company = { id: string; nameAr: string; nameEn: string };

type Props = {
    companies: Company[];
    activeCompanyId: string;
    locale: string;
};

export function CompanySwitcher({ companies, activeCompanyId, locale }: Props) {
    const t = useTranslations("portal.companySwitcher");
    const rtl = locale === "ar";
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const ref = useRef<HTMLDivElement>(null);

    const active = companies.find((c) => c.id === activeCompanyId);
    const others = companies.filter((c) => c.id !== activeCompanyId);

    const name = (c: Company) => (rtl ? c.nameAr : c.nameEn);

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function handleSwitch(companyId: string) {
        setOpen(false);
        startTransition(async () => {
            await switchCompanyAction(companyId);
        });
    }

    if (companies.length <= 1) {
        // Single company: just show the name as a badge, no dropdown
        return (
            <Badge color="brand" size="sm">
                {active ? name(active) : t("noCompany")}
            </Badge>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={isPending}
                className={cx(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium",
                    "text-secondary-fg hover:bg-secondary transition-colors",
                    isPending && "opacity-50 cursor-wait",
                )}
            >
                <span className="max-w-[140px] truncate">
                    {active ? name(active) : t("noCompany")}
                </span>
                {/* Chevron */}
                <svg
                    className={cx("h-3.5 w-3.5 text-tertiary-fg transition-transform", open && "rotate-180")}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div
                    className={cx(
                        "absolute top-full mt-1 z-50 min-w-[200px] rounded-xl border border-secondary bg-primary shadow-lg py-1",
                        rtl ? "right-0" : "left-0",
                    )}
                >
                    <p className="px-3 py-1.5 text-xs font-medium text-tertiary uppercase tracking-wider">
                        {t("myWorkspaces")}
                    </p>

                    {/* Active */}
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-primary truncate">
                            {active ? name(active) : t("noCompany")}
                        </span>
                        <Badge color="brand" size="sm">✓</Badge>
                    </div>

                    {others.length > 0 && <div className="my-1 h-px bg-secondary" />}

                    {others.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSwitch(c.id)}
                            className="w-full px-3 py-2 text-start text-sm text-secondary-fg hover:bg-secondary hover:text-primary transition-colors"
                        >
                            <span className="truncate">{name(c)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
