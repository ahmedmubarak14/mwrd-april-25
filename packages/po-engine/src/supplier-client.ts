import { createServerClient } from "@supabase/ssr";

type CookieBag = {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: {
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }[],
  ) => void;
};

/**
 * Supplier-scoped Supabase client. Used only by apps/supplier.
 *
 * Defense in depth on top of RLS: supplier app queries exclusively
 * `supplier_orders_view` and `supplier_order_items_view`, never base `orders`.
 * RLS scopes by `active_vendor_id` JWT claim. The SQL views project a strict
 * subset of columns (no buyer identity), so even a mistaken join cannot leak
 * buyer data.
 */
export function createSupplierSupabase(cookies: CookieBag) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (list: Parameters<CookieBag["setAll"]>[0]) => cookies.setAll(list),
    },
  });
}
