"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { approveJoinRequestAction, rejectJoinRequestAction } from "../../../../../actions/company";
import { Button } from "@mwrd/ui/components/button";
import { Badge } from "@mwrd/ui/components/badge";

type JoinRequest = {
    id: string;
    userId: string;
    userEmail: string;
    userFullName: string | null;
    message: string | null;
    createdAt: string;
};

// ─── Single request row ───────────────────────────────────────────────────────

function JoinRequestRow({ req }: { req: JoinRequest }) {
    const t = useTranslations("portal.joinRequests");

    const [approveState, approveAction, approvePending] = useActionState(
        approveJoinRequestAction,
        null,
    );
    const [rejectState, rejectAction, rejectPending] = useActionState(
        rejectJoinRequestAction,
        null,
    );

    const done = approveState?.success || rejectState?.success;

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4 sm:flex-row sm:items-start sm:justify-between">
            {/* User info */}
            <div className="space-y-0.5 min-w-0">
                <p className="font-medium text-primary truncate">
                    {req.userFullName ?? req.userEmail}
                </p>
                {req.userFullName && (
                    <p className="text-sm text-tertiary truncate">{req.userEmail}</p>
                )}
                {req.message && (
                    <p className="text-sm text-secondary-fg mt-1 italic">"{req.message}"</p>
                )}
                <p className="text-xs text-tertiary mt-1">
                    {t("requestedAt")}: {new Date(req.createdAt).toLocaleDateString()}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {done ? (
                    <Badge color={approveState?.success ? "success" : "error"} size="sm">
                        {approveState?.success ? t("approved") : t("rejected")}
                    </Badge>
                ) : (
                    <>
                        {/* Approve */}
                        <form action={approveAction}>
                            <input type="hidden" name="requestId" value={req.id} />
                            <Button
                                type="submit"
                                color="primary"
                                size="sm"
                                isDisabled={approvePending || rejectPending}
                                isLoading={approvePending}
                            >
                                {t("approve")}
                            </Button>
                        </form>

                        {/* Reject */}
                        <form action={rejectAction}>
                            <input type="hidden" name="requestId" value={req.id} />
                            <Button
                                type="submit"
                                color="secondary-destructive"
                                size="sm"
                                isDisabled={approvePending || rejectPending}
                                isLoading={rejectPending}
                            >
                                {t("reject")}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main list ────────────────────────────────────────────────────────────────

export function JoinRequestsList({ requests }: { requests: JoinRequest[] }) {
    const t = useTranslations("portal.joinRequests");

    if (requests.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-secondary py-16 text-center">
                <p className="text-sm text-tertiary">{t("empty")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.map((req) => (
                <JoinRequestRow key={req.id} req={req} />
            ))}
        </div>
    );
}
