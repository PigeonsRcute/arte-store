import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "@/components/checkout/CheckoutClient";
import {
  getActiveFreeShippingThreshold,
  getZoneForCountry,
  calculateCartWeightKg,
  calculateShipping,
} from "@/lib/shipping";
import type { ShippingZone } from "@/lib/types";
import type { ShippingEstimateResponse } from "@/app/api/shipping-estimate/route";

async function getCheckoutData() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) return null;

  const [cartResult, profileResult] = await Promise.all([
    supabase
      .from("cart_items")
      .select(
        "id, quantity, products(id, title, slug, price_cents, image_url, image_urls)",
      )
      .eq("user_id", authData.user.id),
    supabase
      .from("profiles")
      .select("full_name, street, city, postal_code, country")
      .eq("id", authData.user.id)
      .single(),
  ]);

  const items = (cartResult.data ?? []).map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    return { id: item.id, quantity: item.quantity, product };
  });

  const profile = profileResult.data;
  const country = profile?.country ?? "";

  const subtotalCents = items.reduce(
    (sum, i) => sum + i.product.price_cents * i.quantity,
    0,
  );

  // Compute initial shipping estimate server-side
  const productIds = items.map((i) => i.product.id);

  const [zonesResult, productCategoriesResult, freeThreshold] =
    await Promise.all([
      supabase.from("shipping_zones").select("*"),
      supabase
        .from("product_categories")
        .select("product_id, categories(slug)")
        .in("product_id", productIds),
      getActiveFreeShippingThreshold(supabase),
    ]);

  const zones: ShippingZone[] = (zonesResult.data ?? []) as ShippingZone[];

  const productCatSlugs: Record<string, string[]> = {};
  for (const pc of productCategoriesResult.data ?? []) {
    const slug = (pc.categories as unknown as { slug: string } | null)?.slug;
    if (slug) {
      if (!productCatSlugs[pc.product_id]) productCatSlugs[pc.product_id] = [];
      productCatSlugs[pc.product_id].push(slug);
    }
  }

  const totalWeightKg = calculateCartWeightKg(
    items.map((i) => ({
      quantity: i.quantity,
      categorySlugs: productCatSlugs[i.product.id] ?? [],
    })),
  );

  const zone = country
    ? getZoneForCountry(country, zones)
    : (zones.find((z) => z.countries.length === 0) ?? null);

  let initialShipping: ShippingEstimateResponse;

  if (!country || !zone) {
    initialShipping = {
      shippingCents: 0,
      isFree: false,
      amountAwayFromFreeCents:
        freeThreshold > 0 ? Math.max(0, freeThreshold - subtotalCents) : 0,
      freeThresholdCents: freeThreshold,
      zoneName: null,
    };
  } else {
    const { shippingCents, isFree, amountAwayFromFreeCents } = calculateShipping(
      {
        subtotalCents,
        totalWeightKg,
        zone,
        freeThresholdCents: freeThreshold,
      },
    );
    initialShipping = {
      shippingCents,
      isFree,
      amountAwayFromFreeCents,
      freeThresholdCents: freeThreshold,
      zoneName: zone.name,
    };
  }

  return {
    items,
    profile,
    email: authData.user.email,
    subtotalCents,
    initialShipping,
  };
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const data = await getCheckoutData();
  const { error } = await searchParams;

  if (!data) redirect("/account?reason=signin_required");
  if (data.items.length === 0) redirect("/cart");

  const errorMessages: Record<string, string> = {
    missing_token: "Payment token missing. Please try again.",
    capture_failed: "Payment could not be completed. Please try again.",
  };
  const errorMessage = error
    ? (errorMessages[error] ?? "An error occurred. Please try again.")
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/cart"
            className="text-sm font-semibold text-zinc-400 transition hover:text-zinc-700"
          >
            ← Cart
          </Link>
          <span className="text-zinc-300">/</span>
          <h1 className="text-2xl font-black text-zinc-900">Checkout</h1>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 ring-2 ring-red-200">
            <p className="font-semibold text-red-700">{errorMessage}</p>
          </div>
        )}

        <CheckoutClient
          items={data.items}
          profile={data.profile}
          email={data.email}
          subtotalCents={data.subtotalCents}
          initialShipping={data.initialShipping}
        />
      </div>
    </div>
  );
}
