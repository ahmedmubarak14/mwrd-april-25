"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@mwrd/db/client";

// ─── Schemas ────────────────────────────────────────────────────────────────

const SignUpSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

async function supabase() {
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

// ─── Sign Up ────────────────────────────────────────────────────────────────

export async function signUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = SignUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "invalid_input" };
  }

  const { fullName, email, password } = parsed.data;
  const sb = await supabase();

  const { error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/auth/callback`,
    },
  });

  if (error) {
    // Supabase returns 422 "User already registered" for duplicate email
    if (error.message.toLowerCase().includes("already registered")) {
      return { success: false, error: "email_taken" };
    }
    return { success: false, error: "generic" };
  }

  return { success: true, data: { email } };
}

// ─── Sign In ────────────────────────────────────────────────────────────────

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "invalid_input" };
  }

  const { email, password } = parsed.data;
  const sb = await supabase();

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("credentials")
    ) {
      return { success: false, error: "invalid_credentials" };
    }
    return { success: false, error: "generic" };
  }

  // Redirect happens after return so cookies are committed first
  redirect("/");
}

// ─── Sign Out ───────────────────────────────────────────────────────────────

export async function signOutAction(): Promise<void> {
  const sb = await supabase();
  await sb.auth.signOut();
  redirect("/ar/signin");
}
