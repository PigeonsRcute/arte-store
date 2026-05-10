import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayPalOrder } from "@/lib/paypal";
import { buildSalePriceMap } from "@/lib/sale-price";
import {
  getActiveFreeShippingThreshold,
  getZoneForCountry,
  calculateCartWeightGrams,
  calculateShipping,
} from "@/lib/shipping";
import type { CttRate, ShippingService, ShippingZone } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let currencyCode = "EUR";
  let currencyDecimals: 0 | 2 = 2;
  let currencyRate = 1;
  let shippingService: ShippingService = "normal";
  try {
    const body = await request.json();
    currencyCode = typeof body.currencyCode === "string" ? body.currencyCode : "EUR";
    currencyDecimals = body.currencyDecimals === 0 ? 0 : 2;
    currencyRate = typeof body.currencyRate === "number" && body.currencyRate > 0
      ? body.currencyRate
      : 1;
    if (body.shippingService === "expresso") shippingService = "expresso";
  } catch {
    // body may be empty — fall back to defaults
  }

  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select("id, quantity, products(id, title, price_cents, stock_quantity, weight_grams)")
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

  const [profileResult, zonesResult, cttRatesResult, productCategoriesResult, freeThreshold, salePriceMap] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("country")
        .eq("id", authData.user.id)
        .single(),
      supabase.from("shipping_zones").select("*"),
      supabase.from("ctt_rates").select("*").order("service").order("max_weight_grams"),
      supabase
        .from("product_categories")
        .select("product_id, categories(slug)")
        .in("product_id", productIds),
      getActiveFreeShippingThreshold(supabase),
      buildSalePriceMap(supabase, items.map((i) => i.product)),
    ]);

  const country = profileResult.data?.country ?? "";
  const zones: ShippingZone[] = (zonesResult.data ?? []) as ShippingZone[];
  const cttRates: CttRate[] = (cttRatesResult.data ?? []) as CttRate[];

  const productCatSlugs: Record<string, string[]> = {};
  for (const pc of productCategoriesResult.data ?? []) {
    const slug = (pc.categories as unknown as { slug: string } | null)?.slug;
    if (slug) {
      if (!productCatSlugs[pc.product_id]) productCatSlugs[pc.product_id] = [];
      productCatSlugs[pc.product_id].push(slug);
    }
  }

  const subtotalCents = items.reduce(
    (sum, i) => sum + (salePriceMap[i.product.id]?.sale_cents ?? i.product.price_cents) * i.quantity,
    0,
  );

  const totalWeightGrams = calculateCartWeightGrams(
    items.map((i) => ({
      quantity: i.quantity,
      weightGrams: i.product.weight_grams ?? null,
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
      totalWeightGrams,
      zone,
      freeThresholdCents: freeThreshold,
      cttRates,
      service: shippingService,
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
        unitPriceCents: salePriceMap[i.product.id]?.sale_cents ?? i.product.price_cents,
      })),
      returnUrl: `${baseUrl}/api/paypal/capture?currency=${encodeURIComponent(currencyCode)}&service=${shippingService}`,
      cancelUrl: `${baseUrl}/checkout`,
      currency: { code: currencyCode, decimals: currencyDecimals, rate: currencyRate },
    });

    return NextResponse.json({ approvalUrl: order.approvalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal error";
    console.error("create-order error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
