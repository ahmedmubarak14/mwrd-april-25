import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isValidLocale } from "@mwrd/i18n/routing";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase, createAdminSupabase } from "@mwrd/db/client";
import { JoinRequestsList } from "./_join-requests-client";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "portal.joinRequests" });
    return { title: t("title") };
}

export default async function JoinRequestsPage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();
    setRequestLocale(locale);

    const t = await getTranslations({ locale, namespace: "portal.joinRequests" });

    const cookieStore = await cookies();
    const sb = createServerSupabase({
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
            for (const { name, value, options } of items) {
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            }
        },
    });

    // Fetch pending join requests for the active company.
    // RLS join_requests_select_same_company handles scoping automatically.
    const { data: rawRequests } = await sb
        .from("company_join_requests")
        .select("id, user_id, message, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

    // Fetch user profiles for the requesters via admin client:
    // requesters don't share active_company_id yet so RLS on users blocks the
    // session client from seeing their rows.
    const userIds = (rawRequests ?? []).map((r) => r.user_id as string);

    const admin = createAdminSupabase();
    const { data: usersData } = userIds.length
        ? await admin
              .from("users")
              .select("id, email, full_name_en, full_name_ar")
              .in("id", userIds)
        : { data: [] };

    const userMap = new Map(
        (usersData ?? []).map((u) => [u.id, u]),
    );

    const requests = (rawRequests ?? []).map((r) => {
        const u = userMap.get(r.user_id as string);
        return {
            id: r.id as string,
            userId: r.user_id as string,
            userEmail: (u as { email?: string })?.email ?? "",
            userFullName: (u as { full_name_en?: string; full_name_ar?: string })?.full_name_en ?? null,
            message: r.message as string | null,
            createdAt: r.created_at as string,
        };
    });

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">{t("title")}</h1>
                <p className="mt-1 text-sm text-tertiary">{t("subtitle")}</p>
            </div>

            <JoinRequestsList requests={requests} />
        </div>
    );
}
