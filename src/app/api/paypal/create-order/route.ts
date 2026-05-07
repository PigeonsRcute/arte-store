import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayPalOrder } from "@/lib/paypal";
import {
  getActiveFreeShippingThreshold,
  getZoneForCountry,
  calculateCartWeightKg,
  calculateShipping,
} from "@/lib/shipping";
import type { ShippingZone } from "@/lib/types";

export async function POST() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select("id, quantity, products(id, title, price_cents, stock_quantity)")
    .eq("user_id", authData.user.id);

  if (cartError) {
    return NextResponse.json({ error: "cart_fetch_failed" }, { status: 500 });
  }

  if (!cartItems?.length) {
    return NextResponse.json({ error: "cart_empty" }, { status: 400 });
  }

  const items = cartItems.map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    return { ...item, product };
  });

  // Validate stock before creating PayPal order
  for (const item of items) {
    if (!item.product || item.quantity > item.product.stock_quantity) {
      return NextResponse.json(
        { error: "insufficient_stock", productId: item.product?.id },
        { status: 400 },
      );
    }
  }

  const productIds = items.map((i) => i.product.id);

  // Fetch everything needed for shipping calculation in parallel
  const [profileResult, zonesResult, productCategoriesResult, freeThreshold] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("country")
        .eq("id", authData.user.id)
        .single(),
      supabase.from("shipping_zones").select("*"),
      supabase
        .from("product_categories")
        .select("product_id, categories(slug)")
        .in("product_id", productIds),
      getActiveFreeShippingThreshold(supabase),
    ]);

  const country = profileResult.data?.country ?? "";
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
    (sum, i) => sum + i.product.price_cents * i.quantity,
    0,
  );

  const totalWeightKg = calculateCartWeightKg(
    items.map((i) => ({
      quantity: i.quantity,
      categorySlugs: productCatSlugs[i.product.id] ?? [],
    })),
  );

  const zone = country
    ? getZoneForCountry(country, zones)
    : (zones.find((z) => z.countries.length === 0) ?? null);

  let shippingCents = 0;
  if (zone) {
    ({ shippingCents } = calculateShipping({
      subtotalCents,
      totalWeightKg,
      zone,
      freeThresholdCents: freeThreshold,
    }));
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  try {
    const order = await createPayPalOrder({
      subtotalCents,
      shippingCents,
      items: items.map((i) => ({
        name: i.product.title,
        quantity: i.quantity,
        unitPriceCents: i.product.price_cents,
      })),
      returnUrl: `${baseUrl}/api/paypal/capture`,
      cancelUrl: `${baseUrl}/checkout`,
    });

    return NextResponse.json({ approvalUrl: order.approvalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal error";
    console.error("create-order error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
