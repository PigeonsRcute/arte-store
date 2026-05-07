import type { SupabaseClient } from "@supabase/supabase-js";

// addToCart uses SELECT + INSERT/UPDATE rather than a single upsert because
// Supabase's .upsert() cannot increment — it would overwrite the existing quantity.
export async function addToCart(
  supabase: SupabaseClient,
  productId: string,
  quantity: number = 1,
): Promise<{ error: string | null }> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return { error: "not_authenticated" };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: productId,
    quantity,
  });
  return { error: error?.message ?? null };
}

export async function updateCartQuantity(
  supabase: SupabaseClient,
  cartItemId: string,
  quantity: number,
): Promise<{ error: string | null }> {
  if (quantity < 1) {
    return removeFromCart(supabase, cartItemId);
  }
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);
  return { error: error?.message ?? null };
}

// Same SELECT + INSERT/UPDATE pattern as addToCart, but for nail products.
export async function addNailToCart(
  supabase: SupabaseClient,
  nailProductId: string,
  quantity: number = 1,
): Promise<{ error: string | null }> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return { error: "not_authenticated" };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("nail_product_id", nailProductId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    nail_product_id: nailProductId,
    quantity,
  });
  return { error: error?.message ?? null };
}

export async function removeFromCart(
  supabase: SupabaseClient,
  cartItemId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);
  return { error: error?.message ?? null };
}
