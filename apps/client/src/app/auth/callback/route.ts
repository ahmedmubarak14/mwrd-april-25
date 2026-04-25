import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@mwrd/db/client";

/**
 * Supabase email confirmation callback.
 * Supabase redirects here with ?code=<pkce_code> after the user clicks the
 * link in their inbox. We exchange it for a session then redirect into the app.
 *
 * Route must be outside [locale] so next-intl doesn't intercept it first.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` can be set by Supabase to redirect back to a specific page
  const next = searchParams.get("next") ?? "/";

  const cookieStore = await cookies();
  const sb = createServerSupabase({
    getAll: () => cookieStore.getAll(),
    setAll: (items) => {
      for (const { name, value, options } of items) {
        cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
      }
    },
  });

  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful verification — send to onboarding.
      // Onboarding layout checks active_company_id and skips straight to
      // the portal if the user is already in a company.
      const destination = next === "/" ? "/ar/onboarding" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Verification failed — redirect to signin with an error flag
  return NextResponse.redirect(`${origin}/ar/signin?error=verification_failed`);
}
