-- Fix advisor WARN lints: set explicit search_path on helper functions.
-- INFO lint on webhook_events (RLS enabled, no policy) is intentional —
-- webhook_events is service_role only, default-deny for authenticated.

alter function public.active_company_id() set search_path = '';
alter function public.active_vendor_id() set search_path = '';
alter function public.email_verified() set search_path = '';

-- Move unaccent extension out of public schema per Supabase advisor.
create schema if not exists extensions;
alter extension unaccent set schema extensions;
