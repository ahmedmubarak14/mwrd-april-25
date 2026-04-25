/**
 * Drizzle schema barrel. Domain modules group logically related tables.
 * See schema v0 doc agreed 2026-04-25.
 *
 * RLS policies, SQL views (`supplier_orders_view`, `supplier_order_items_view`),
 * the `custom_access_token_hook` Auth Hook function, the
 * `on_auth_user_created` trigger, and seed system roles are applied via raw
 * SQL migrations in `supabase/migrations/` (Phase 3b).
 */
export * from "./_enums";
export * from "./identity";
export * from "./vendor";
export * from "./catalog";
export * from "./address";
export * from "./cart";
export * from "./order";
export * from "./payment";
export * from "./wallet";
export * from "./tag";
export * from "./return";
export * from "./favourite";
export * from "./invoice";
export * from "./webhook";
