"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerSupabase } from "@mwrd/db/client";

type ActionResult<T = undefined> =
    | { success: true; data?: T }
    | { success: false; error: string };

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

// ─── Add to cart ─────────────────────────────────────────────────────────────

/**
 * Gets-or-creates the open cart for (user, company, vendor) then upserts
 * the cart item. Price is snapshotted from the product row at call time.
 */
export async function addToCartAction(
    _prev: ActionResult | null,
    formData: FormData,
): Promise<ActionResult> {
    const sb = await userSupabase();

    const {
        data: { user },
        error: authError,
    } = await sb.auth.getUser();
    if (authError || !user) return { success: false, error: "unauthenticated" };

    const productId = formData.get("productId");
    const qty = Number(formData.get("qty") ?? 1);

    if (typeof productId !== "string" || !Number.isInteger(qty) || qty < 1) {
        return { success: false, error: "invalid_input" };
    }

    // Fetch product to get vendorId + current price
    const { data: product, error: productError } = await sb
        .from("products")
        .select("id, vendor_id, price_halalas, min_order_qty, max_order_qty, stock_on_hand, is_active")
        .eq("id", productId)
        .eq("is_active", true)
        .single();

    if (productError || !product) return { success: false, error: "product_not_found" };
    if ((product.stock_on_hand as number) < qty) return { success: false, error: "out_of_stock" };

    const vendorId = product.vendor_id as string;

    // Get the user's active_company_id from their profile
    const { data: profile } = await sb
        .from("users")
        .select("active_company_id")
        .eq("id", user.id)
        .single();

    const companyId = profile?.active_company_id as string | null;
    if (!companyId) return { success: false, error: "no_company" };

    // Get or create open cart
    let cartId: string;
    const { data: existingCart } = await sb
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .eq("vendor_id", vendorId)
        .eq("status", "open")
        .maybeSingle();

    if (existingCart) {
        cartId = existingCart.id as string;
    } else {
        const { data: newCart, error: cartError } = await sb
            .from("carts")
            .insert({ user_id: user.id, company_id: companyId, vendor_id: vendorId })
            .select("id")
            .single();
        if (cartError || !newCart) return { success: false, error: "cart_create_failed" };
        cartId = newCart.id as string;
    }

    // Upsert cart item — increment quantity if already present
    const { data: existingItem } = await sb
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .is("destination_address_id", null)
        .maybeSingle();

    if (existingItem) {
        const newQty = (existingItem.quantity as number) + qty;
        const max = product.max_order_qty as number | null;
        const capped = max ? Math.min(newQty, max) : newQty;

        await sb
            .from("cart_items")
            .update({ quantity: capped })
            .eq("id", existingItem.id as string);
    } else {
        await sb.from("cart_items").insert({
            cart_id: cartId,
            product_id: productId,
            quantity: qty,
            unit_price_halalas_snapshot: product.price_halalas as number,
        });
    }

    revalidatePath("/[locale]/cart", "page");
    return { success: true };
}

// ─── Remove cart item ─────────────────────────────────────────────────────────

export async function removeCartItemAction(
    _prev: ActionResult | null,
    formData: FormData,
): Promise<ActionResult> {
    const sb = await userSupabase();
    const {
        data: { user },
    } = await sb.auth.getUser();
    if (!user) return { success: false, error: "unauthenticated" };

    const itemId = formData.get("itemId");
    if (typeof itemId !== "string") return { success: false, error: "invalid_input" };

    await sb.from("cart_items").delete().eq("id", itemId);
    revalidatePath("/[locale]/cart", "page");
    return { success: true };
}

// ─── Update cart item quantity ────────────────────────────────────────────────

export async function updateCartItemQtyAction(
    _prev: ActionResult | null,
    formData: FormData,
): Promise<ActionResult> {
    const sb = await userSupabase();
    const {
        data: { user },
    } = await sb.auth.getUser();
    if (!user) return { success: false, error: "unauthenticated" };

    const itemId = formData.get("itemId");
    const qty = Number(formData.get("qty"));
    if (typeof itemId !== "string" || !Number.isInteger(qty) || qty < 1) {
        return { success: false, error: "invalid_input" };
    }

    await sb.from("cart_items").update({ quantity: qty }).eq("id", itemId);
    revalidatePath("/[locale]/cart", "page");
    return { success: true };
}
