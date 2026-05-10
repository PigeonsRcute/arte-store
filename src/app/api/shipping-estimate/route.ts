import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveFreeShippingThreshold,
  getZoneForCountry,
  calculateCartWeightGrams,
  calculateShipping,
  calculatePortugalShippingOptions,
  isPortugalZone,
} from "@/lib/shipping";
import type { CttRate, ShippingService, ShippingZone } from "@/lib/types";

export interface ShippingEstimateResponse {
  shippingCents: number;
  isFree: boolean;
  amountAwayFromFreeCents: number;
  freeThresholdCents: number;
  zoneName: string | null;
  // Present for Portugal — both CTT service prices
  cttOptions: { normalCents: number | null; expressoCents: number | null } | null;
  defaultService: ShippingService;
}

/**
 * GET /api/shipping-estimate?country=PT&service=normal
 *
 * Returns a shipping cost estimate for the authenticated user's current cart
 * and the given country code. Called live when the user changes their
 * shipping address country on the checkout page.
 */
export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") ?? "";
  const rawService = request.nextUrl.searchParams.get("service");
  const service: ShippingService = rawService === "expresso" ? "expresso" : "normal";

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const userId = authData.user.id;

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("quantity, products(id, price_cents, weight_grams)")
    .eq("user_id", userId);

  if (!cartItems?.length) {
    const payload: ShippingEstimateResponse = {
      shippingCents: 0,
      isFree: false,
      amountAwayFromFreeCents: 0,
      freeThresholdCents: 0,
      zoneName: null,
      cttOptions: null,
      defaultService: "normal",
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

  const [zonesResult, cttRatesResult, settingsResult, productCategoriesResult, freeThreshold] =
    await Promise.all([
      supabase.from("shipping_zones").select("*"),
      supabase.from("ctt_rates").select("*").order("service").order("max_weight_grams"),
      supabase.from("shipping_settings").select("default_shipping_service").eq("id", "default").single(),
      supabase
        .from("product_categories")
        .select("product_id, categories(slug)")
        .in("product_id", productIds),
      getActiveFreeShippingThreshold(supabase),
    ]);

  const zones: ShippingZone[] = (zonesResult.data ?? []) as ShippingZone[];
  const cttRates: CttRate[] = (cttRatesResult.data ?? []) as CttRate[];
  const defaultService: ShippingService =
    settingsResult.data?.default_shipping_service === "expresso" ? "expresso" : "normal";

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

  const totalWeightGrams = calculateCartWeightGrams(
    items.map((i) => ({
      quantity: i.quantity,
      weightGrams: i.product?.weight_grams ?? null,
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
      cttOptions: null,
      defaultService,
    };
    return NextResponse.json(payload);
  }

  const cttOptions = isPortugalZone(zone)
    ? calculatePortugalShippingOptions(totalWeightGrams, cttRates)
    : null;

  const { shippingCents, isFree, amountAwayFromFreeCents } = calculateShipping({
    subtotalCents,
    totalWeightGrams,
    zone,
    freeThresholdCents: freeThreshold,
    cttRates,
    service,
  });

  const payload: ShippingEstimateResponse = {
    shippingCents,
    isFree,
    amountAwayFromFreeCents,
    freeThresholdCents: freeThreshold,
    zoneName: zone.name,
    cttOptions,
    defaultService,
  };

  return NextResponse.json(payload);
}
