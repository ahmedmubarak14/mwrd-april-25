# MWRD V3 — Claude Code Project Guide

MWRD V3 monorepo. Office supplies vertical — first transactional product on MWRD. Pilot target: 50+ person Saudi enterprise, week 10.

## Stack
- Turborepo 2.9 + pnpm 10 workspaces
- Next.js 16 App Router + React 19
- TypeScript 5.9 strict + `noUncheckedIndexedAccess`
- Supabase (Bahrain region) — auth + Postgres + Storage
- Drizzle ORM + drizzle-kit (migrations checked into `supabase/migrations/`)
- Tailwind CSS 3.4 + shadcn/ui vendored into `packages/ui`
- next-intl bilingual ar/en (ar default, RTL)
- Moyasar payments (behind `PaymentProvider` in `packages/payments`)
- Standard tax invoices v1, ZATCA Phase 2 v1.1 (behind `InvoiceProvider` in `packages/invoicing`)

## Apps
- `apps/landing` (port 3000) — public marketing
- `apps/client` (port 3001) — buyer portal
- `apps/supplier` (port 3002) — supplier portal, queries anonymized views
- `apps/backoffice` (port 3003) — MWRD internal ops

## Shared packages
- `@mwrd/db` — Drizzle schemas, Supabase client factories
- `@mwrd/payments` — `PaymentProvider` interface, halalas conversion, MoyasarProvider
- `@mwrd/invoicing` — `InvoiceProvider` interface, seller config (Byan Solutions), StandardTaxInvoiceProvider
- `@mwrd/po-engine` — dual-PO anonymization, supplier-scoped Supabase client, order numbering
- `@mwrd/ui` — shadcn primitives, MWRD tokens (navy + lime), `cn` helper, Tailwind preset
- `@mwrd/i18n` — next-intl routing + request config, shared messages
- `@mwrd/eslint-config` — flat ESLint configs (base, next, react-internal)
- `@mwrd/typescript-config` — tsconfig bases (base, nextjs, react-library, node-library)

## Non-negotiables — every PR checks these
1. Every `public.*` table has RLS enabled, scoped by `active_company_id` from JWT (never cookies)
2. Supplier app queries ONLY `supplier_orders_view` + `supplier_order_items_view` — never base `orders`
3. Supplier-visible shipping recipient is `MWRD Logistics — {supplier_order_number}` — never the buyer company name
4. All money is `_halalas` INT. Conversion via `@mwrd/payments/money` only
5. Moyasar calls go through `@mwrd/payments` only. Never imported from app code
6. Invoice generation goes through `@mwrd/invoicing` only. Never inlined in routes or components
7. Idempotency keys on every payment op: order ID for order payments, unique key for top-ups
8. Webhook handlers verify Moyasar signature BEFORE any state mutation. No exceptions
9. Server actions for mutations. Route handlers only for external callbacks (webhooks) and SSG
10. Bilingual ar/en day one: every screen, every email, every PDF. i18n keys, never hardcoded strings
11. Drizzle types → Zod validation → server action → client. No `any` in production paths
12. Test keys only for Moyasar in dev. Live keys at week 10 smoke test only

## Invoice seller identity (v1)
Registered seller on invoices is **Byan Solutions Company** (شركة بيان سولووشنز), CR `7053965591`, VAT `314709605800003`. NOT MWRD. MWRD is the trading/platform brand. Hardcoded in `packages/invoicing/src/config.ts`.

## Commands
- `pnpm dev` — all apps in dev
- `pnpm build` — production build
- `pnpm check-types` — TypeScript check across workspace
- `pnpm lint` — ESLint across workspace
- `pnpm --filter @mwrd/db drizzle:generate` — generate migration from schema diff
- `pnpm --filter @mwrd/db drizzle:studio` — Drizzle Studio UI

## Environment
- Node 20 LTS (pin in `.nvmrc`)
- pnpm 10.33.2 (pin in root `packageManager`)
- Supabase project: Bahrain region. Required env vars per app:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (backoffice + server actions only — never ship to client)
  - `DATABASE_URL` (for Drizzle — direct Postgres connection)
- Moyasar: `MOYASAR_SECRET_KEY`, `MOYASAR_PUBLISHABLE_KEY`, `MOYASAR_WEBHOOK_SECRET` — test keys in dev only
- Resend: `RESEND_API_KEY` for transactional email

## Multi-company tenancy
Active company lives in a custom JWT claim `active_company_id`, stamped by a Supabase Custom Access Token Hook reading from `public.users.active_company_id` (cached denorm). Switching company = update the row + `supabase.auth.refreshSession()`. Supplier side uses `active_vendor_id` the same way. All RLS policies read the claim via `(select auth.jwt() ->> 'active_company_id')::uuid` — subquery-wrapped for per-query caching.
