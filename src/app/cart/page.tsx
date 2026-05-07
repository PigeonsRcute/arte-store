import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CartItemWithProduct } from "@/lib/types";
import CartContents from "@/components/cart/CartContents";
import { getActiveFreeShippingThreshold } from "@/lib/shipping";

async function getCartData(): Promise<{
  items: CartItemWithProduct[];
  isSignedIn: boolean;
  freeShippingThresholdCents: number;
}> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user ?? null;

    if (!user) {
      return { items: [], isSignedIn: false, freeShippingThresholdCents: 0 };
    }

    const [cartResult, threshold] = await Promise.all([
      supabase
        .from("cart_items")
        .select("*, products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      getActiveFreeShippingThreshold(supabase),
    ]);

    return {
      items: (cartResult.data ?? []) as CartItemWithProduct[],
      isSignedIn: true,
      freeShippingThresholdCents: threshold,
    };
  } catch {
    return { items: [], isSignedIn: false, freeShippingThresholdCents: 0 };
  }
}

export default async function CartPage() {
  const { items, isSignedIn, freeShippingThresholdCents } = await getCartData();

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
          />
        )}
      </div>
    </div>
  );
}
