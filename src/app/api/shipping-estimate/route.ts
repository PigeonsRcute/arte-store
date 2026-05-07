import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveFreeShippingThreshold,
  getZoneForCountry,
  calculateCartWeightKg,
  calculateShipping,
} from "@/lib/shipping";
import type { ShippingZone } from "@/lib/types";

export interface ShippingEstimateResponse {
  shippingCents: number;
  isFree: boolean;
  amountAwayFromFreeCents: number;
  freeThresholdCents: number;
  zoneName: string | null;
}

/**
 * GET /api/shipping-estimate?country=PT
 *
 * Returns a shipping cost estimate for the authenticated user's current cart
 * and the given country code. Called live when the user changes their
 * shipping address country on the checkout page.
 */
export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") ?? "";

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const userId = authData.user.id;

  // Fetch cart items, zones, free threshold, and product categories in parallel
  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("quantity, products(id, price_cents)")
    .eq("user_id", userId);

  if (!cartItems?.length) {
    // Empty cart — no shipping needed
    const payload: ShippingEstimateResponse = {
      shippingCents: 0,
      isFree: false,
      amountAwayFromFreeCents: 0,
      freeThresholdCents: 0,
      zoneName: null,
    };
    return NextResponse.json(payload);
  }

  const items = cartItems.map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    return { quantity: item.quantity, product };
  });

  const productIds = items
    .map((i) => i.product?.id)
    .filter((id): id is string => id != null);

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

  // Build product_id → category slugs map
  const productCatSlugs: Record<string, string[]> = {};
  for (const pc of productCategoriesResult.data ?? []) {
    const slug = (pc.categories as unknown as { slug: string } | null)?.slug;
    if (slug) {
      if (!productCatSlugs[pc.product_id]) productCatSlugs[pc.product_id] = [];
      productCatSlugs[pc.product_id].push(slug);
    }
  }

  const subtotalCents = items.reduce(
    (sum, i) => sum + (i.product?.price_cents ?? 0) * i.quantity,
    0,
  );

  const totalWeightKg = calculateCartWeightKg(
    items.map((i) => ({
      quantity: i.quantity,
      categorySlugs: productCatSlugs[i.product?.id ?? ""] ?? [],
    })),
  );

  const zone = country
    ? getZoneForCountry(country, zones)
    : (zones.find((z) => z.countries.length === 0) ?? null);

  if (!zone) {
    const payload: ShippingEstimateResponse = {
      shippingCents: 0,
      isFree: false,
      amountAwayFromFreeCents:
        freeThreshold > 0 ? Math.max(0, freeThreshold - subtotalCents) : 0,
      freeThresholdCents: freeThreshold,
      zoneName: null,
    };
    return NextResponse.json(payload);
  }

  const { shippingCents, isFree, amountAwayFromFreeCents } = calculateShipping({
    subtotalCents,
    totalWeightKg,
    zone,
    freeThresholdCents: freeThreshold,
  });

  const payload: ShippingEstimateResponse = {
    shippingCents,
    isFree,
    amountAwayFromFreeCents,
    freeThresholdCents: freeThreshold,
    zoneName: zone.name,
  };

  return NextResponse.json(payload);
}
