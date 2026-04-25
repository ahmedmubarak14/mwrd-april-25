"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase, createAdminSupabase } from "@mwrd/db/client";

// ─── Schemas ────────────────────────────────────────────────────────────────

const CreateCompanySchema = z.object({
    nameAr: z.string().min(2).max(200),
    nameEn: z.string().min(2).max(200),
    emailDomain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).optional(),
});

const RequestJoinSchema = z.object({
    companyId: z.string().uuid(),
    message: z.string().max(500).optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
    | { success: true; data?: T }
    | { success: false; error: string };

type Company = { id: string; nameAr: string; nameEn: string; emailDomain: string | null };

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function userSupabase() {
    const cookieStore = await cookies();
    return createServerSupabase({
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
            for (const { name, value, options } of items) {
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            }
        },
    });
}

/**
 * Extract the domain from an email address.
 * e.g. "ahmed@acme.com" → "acme.com"
 */
function emailToDomain(email: string): string {
    return email.split("@")[1]?.toLowerCase() ?? "";
}

// ─── Detect company by email domain ─────────────────────────────────────────

/**
 * Returns companies whose email_domain matches the authenticated user's email
 * domain. Uses the session client so RLS is applied (companies are publicly
 * selectable by authenticated users).
 */
export async function detectCompanyAction(): Promise<
    ActionResult<{ companies: Company[]; userDomain: string }>
> {
    const sb = await userSupabase();

    const {
        data: { user },
        error: authError,
    } = await sb.auth.getUser();

    if (authError || !user?.email) {
        return { success: false, error: "unauthenticated" };
    }

    const domain = emailToDomain(user.email);

    if (!domain) {
        return { success: true, data: { companies: [], userDomain: "" } };
    }

    const { data, error } = await sb
        .from("companies")
        .select("id, name_ar, name_en, email_domain")
        .eq("email_domain", domain);

    if (error) {
        return { success: false, error: "db_error" };
    }

    const companies: Company[] = (data ?? []).map((row) => ({
        id: row.id as string,
        nameAr: row.name_ar as string,
        nameEn: row.name_en as string,
        emailDomain: row.email_domain as string | null,
    }));

    return { success: true, data: { companies, userDomain: domain } };
}

// ─── Create company ──────────────────────────────────────────────────────────

/**
 * Creates a new company + makes the current user its first Admin member.
 *
 * MUST use the admin/service-role client because:
 * - `companies` table has no INSERT RLS policy for authenticated users
 * - `company_members` table has no INSERT RLS policy for authenticated users
 *
 * After insert we update `public.users.active_company_id` (also via admin
 * client), then call refreshSession() on the user client so the JWT picks up
 * the new `active_company_id` claim.
 */
export async function createCompanyAction(
    _prev: ActionResult<{ companyId: string }> | null,
    formData: FormData,
): Promise<ActionResult<{ companyId: string }>> {
    const sb = await userSupabase();
    const admin = createAdminSupabase();

    // 1. Authenticate
    const {
        data: { user },
        error: authError,
    } = await sb.auth.getUser();

    if (authError || !user?.email) {
        return { success: false, error: "unauthenticated" };
    }

    // 2. Validate input
    const emailDomain = emailToDomain(user.email);

    const parsed = CreateCompanySchema.safeParse({
        nameAr: formData.get("nameAr"),
        nameEn: formData.get("nameEn"),
        // Auto-populate email domain from the user's email
        emailDomain: emailDomain || undefined,
    });

    if (!parsed.success) {
        return { success: false, error: "invalid_input" };
    }

    const { nameAr, nameEn, emailDomain: domain } = parsed.data;

    // 3. Create company via admin client
    const { data: company, error: companyError } = await admin
        .from("companies")
        .insert({
            name_ar: nameAr,
            name_en: nameEn,
            email_domain: domain ?? null,
        })
        .select("id")
        .single();

    if (companyError || !company) {
        console.error("[createCompanyAction] company insert error:", companyError);
        return { success: false, error: "create_failed" };
    }

    const companyId = company.id as string;

    // 4. Add user as Admin member (system Admin role UUID: 00000000-0000-0000-0000-000000000001)
    const ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000001";

    const { error: memberError } = await admin.from("company_members").insert({
        user_id: user.id,
        company_id: companyId,
        role_id: ADMIN_ROLE_ID,
        is_active: true,
    });

    if (memberError) {
        console.error("[createCompanyAction] member insert error:", memberError);
        // Best-effort cleanup
        await admin.from("companies").delete().eq("id", companyId);
        return { success: false, error: "member_failed" };
    }

    // 5. Stamp active_company_id on the user profile (via admin to bypass RLS)
    const { error: userUpdateError } = await admin
        .from("users")
        .update({ active_company_id: companyId })
        .eq("id", user.id);

    if (userUpdateError) {
        console.error("[createCompanyAction] user update error:", userUpdateError);
        // Non-fatal — the member row is set; the JWT claim may be stale but
        // the user can still sign out/in to refresh.
    }

    // 6. Refresh the session so the JWT picks up active_company_id from the
    //    custom access token hook.
    await sb.auth.refreshSession();

    // 7. Redirect into the buyer portal
    redirect("/ar");
}

// ─── Switch active company ───────────────────────────────────────────────────

/**
 * Changes the user's active company. Uses the session client for both the
 * membership check and the profile update because `users_update_self` RLS
 * allows self-update. We then refresh the session so the JWT picks up the new
 * `active_company_id` claim via the custom access token hook.
 */
export async function switchCompanyAction(companyId: string): Promise<void> {
    const sb = await userSupabase();

    const {
        data: { user },
        error: authError,
    } = await sb.auth.getUser();

    if (authError || !user) redirect("/ar/signin");

    // Verify the user is actually an active member of the target company
    const { data: membership, error: memberError } = await sb
        .from("company_members")
        .select("id")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (memberError || !membership) {
        // Silently ignore unauthorized switch attempts
        return;
    }

    // Update active_company_id (allowed by users_update_self RLS policy)
    await sb.from("users").update({ active_company_id: companyId }).eq("id", user.id);

    // Refresh session so JWT claim is updated
    await sb.auth.refreshSession();

    redirect("/ar");
}

// ─── Approve join request ────────────────────────────────────────────────────

/**
 * Approves a pending join request:
 *   1. Fetches the request (RLS: admin sees company's requests)
 *   2. INSERTs a company_member row (admin client — no INSERT RLS for authenticated)
 *   3. Updates the requester's active_company_id (admin client)
 *   4. Marks request as approved (admin client — no UPDATE RLS for authenticated)
 *
 * Must be called by an admin of the company whose request is being approved.
 */
export async function approveJoinRequestAction(
    _prev: ActionResult<undefined> | null,
    formData: FormData,
): Promise<ActionResult<undefined>> {
    const sb = await userSupabase();
    const admin = createAdminSupabase();

    const {
        data: { user },
        error: authError,
    } = await sb.auth.getUser();

    if (authError || !user) return { success: false, error: "unauthenticated" };

    const requestId = formData.get("requestId");
    if (typeof requestId !== "string") return { success: false, error: "invalid_input" };

    // Fetch request (session client: RLS join_requests_select_same_company ensures
    // only admins in the right company can see it)
    const { data: req, error: fetchError } = await sb
        .from("company_join_requests")
        .select("id, user_id, company_id, status")
        .eq("id", requestId)
        .eq("status", "pending")
        .single();

    if (fetchError || !req) return { success: false, error: "not_found" };

    const REQUESTER_ROLE_ID = "00000000-0000-0000-0000-000000000002"; // Requester system role

    // 1. Insert member
    const { error: memberError } = await admin.from("company_members").insert({
        user_id: req.user_id,
        company_id: req.company_id,
        role_id: REQUESTER_ROLE_ID,
        is_active: true,
    });

    if (memberError) {
        // Already a member (unique constraint)
        if (memberError.code !== "23505") {
            console.error("[approveJoinRequestAction] member insert:", memberError);
            return { success: false, error: "member_failed" };
        }
    }

    // 2. Set active_company_id on the requester's profile
    await admin
        .from("users")
        .update({ active_company_id: req.company_id })
        .eq("id", req.user_id);

    // 3. Mark approved (admin client — no UPDATE policy for authenticated users)
    await admin
        .from("company_join_requests")
        .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);

    return { success: true };
}

// ─── Reject join request ─────────────────────────────────────────────────────

export async function rejectJoinRequestAction(
    _prev: ActionResult<undefined> | null,
    formData: FormData,
): Promise<ActionResult<undefined>> {
    const sb = await userSupabase();
    const admin = createAdminSupabase();

    const {
        data: { user },
        error: authError,
    } = await sb.auth.getUser();

    if (authError || !user) return { success: false, error: "unauthenticated" };

    const requestId = formData.get("requestId");
    const reason = formData.get("reason");
    if (typeof requestId !== "string") return { success: false, error: "invalid_input" };

    // Confirm it exists + is for the admin's company (via RLS)
    const { data: req, error: fetchError } = await sb
        .from("company_join_requests")
        .select("id")
        .eq("id", requestId)
        .eq("status", "pending")
        .single();

    if (fetchError || !req) return { success: false, error: "not_found" };

    await admin
        .from("company_join_requests")
        .update({
            status: "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: typeof reason === "string" && reason ? reason : null,
        })
        .eq("id", requestId);

    return { success: true };
}

// ─── Request join ────────────────────────────────────────────────────────────

/**
 * Submits a join request for an existing company detected via email domain.
 * RLS allows INSERT here: `company_join_requests` has policy
 * `with check (user_id = auth.uid())`.
 */
export async function requestJoinAction(
    _prev: ActionResult<undefined> | null,
    formData: FormData,
): Promise<ActionResult<undefined>> {
    const sb = await userSupabase();

    const {
        data: { user },
        error: authError,
    } = await sb.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "unauthenticated" };
    }

    const parsed = RequestJoinSchema.safeParse({
        companyId: formData.get("companyId"),
        message: formData.get("message") ?? undefined,
    });

    if (!parsed.success) {
        return { success: false, error: "invalid_input" };
    }

    const { companyId, message } = parsed.data;

    const { error } = await sb.from("company_join_requests").insert({
        user_id: user.id,
        company_id: companyId,
        message: message ?? null,
        status: "pending",
    });

    if (error) {
        // Unique constraint: already has a pending request
        if (error.code === "23505") {
            return { success: false, error: "already_requested" };
        }
        console.error("[requestJoinAction] insert error:", error);
        return { success: false, error: "request_failed" };
    }

    return { success: true };
}
