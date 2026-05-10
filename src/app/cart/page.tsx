import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CartItemWithProduct, Product } from "@/lib/types";
import { buildSalePriceMap, type SalePriceMap } from "@/lib/sale-price";
import CartContents from "@/components/cart/CartContents";
import { getActiveFreeShippingThreshold } from "@/lib/shipping";

async function getCartData(): Promise<{
  items: CartItemWithProduct[];
  isSignedIn: boolean;
  freeShippingThresholdCents: number;
  salePriceMap: SalePriceMap;
  profileCountry: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user ?? null;

    if (!user) {
      return { items: [], isSignedIn: false, freeShippingThresholdCents: 0, salePriceMap: {}, profileCountry: null };
    }

    const [cartResult, threshold, profileResult] = await Promise.all([
      supabase
        .from("cart_items")
        .select("*, products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      getActiveFreeShippingThreshold(supabase),
      supabase.from("profiles").select("country").eq("id", user.id).single(),
    ]);

    const items = (cartResult.data ?? []) as CartItemWithProduct[];
    const products = items
      .map((item) => item.products)
      .filter((p): p is Product => p !== null);
    const salePriceMap = products.length > 0
      ? await buildSalePriceMap(supabase, products)
      : {};

    return {
      items,
      isSignedIn: true,
      freeShippingThresholdCents: threshold,
      salePriceMap,
      profileCountry: profileResult.data?.country ?? null,
    };
  } catch {
    return { items: [], isSignedIn: false, freeShippingThresholdCents: 0, salePriceMap: {}, profileCountry: null };
  }
}

export default async function CartPage() {
  const { items, isSignedIn, freeShippingThresholdCents, salePriceMap, profileCountry } = await getCartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-pink-700">Your Cart</h1>
            {isSignedIn && items.length > 0 && (
              <p className="text-sm text-zinc-500">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            )}
          </div>
          <Link
            href="/shop"
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200"
          >
            ← Shop
          </Link>
        </div>

        {/* Not signed in */}
        {!isSignedIn && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-2 ring-yellow-200">
            <p className="text-2xl font-black text-zinc-400">Sign in to view your cart.</p>
            <p className="mt-2 text-sm text-zinc-400">
              Your cart is saved to your account.
            </p>
            <Link
              href="/account"
              className="mt-6 inline-block rounded-2xl bg-pink-500 px-6 py-3 text-sm font-black text-white transition hover:bg-pink-400"
            >
              Sign In / Sign Up
            </Link>
          </div>
        )}

        {/* Cart items or empty state */}
        {isSignedIn && (
          <CartContents
            initialItems={items}
            freeShippingThresholdCents={freeShippingThresholdCents}
            salePriceMap={salePriceMap}
            profileCountry={profileCountry}
          />
        )}
      </div>
    </div>
  );
}
