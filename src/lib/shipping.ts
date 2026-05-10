import type { SupabaseClient } from "@supabase/supabase-js";
import type { CttRate, ShippingService, ShippingZone } from "@/lib/types";

// Category slug → default weight in grams.
// Used only when a product has no explicit weight_grams set.
const CATEGORY_DEFAULT_GRAMS: Record<string, number> = {
  stickers:  50,
  prints:   200,
  supagaes: 200,
  keychains: 100,
  pins:       80,
};
const DEFAULT_WEIGHT_GRAMS = 150;

/**
 * Returns the shipping weight in grams for a product.
 * Prefers the explicit weight_grams field; falls back to category default.
 */
export function getProductWeightGrams(
  weightGrams: number | null | undefined,
  categorySlugs: string[],
): number {
  if (weightGrams != null && weightGrams > 0) return weightGrams;
  for (const slug of categorySlugs) {
    if (slug in CATEGORY_DEFAULT_GRAMS) return CATEGORY_DEFAULT_GRAMS[slug];
  }
  return DEFAULT_WEIGHT_GRAMS;
}

/**
 * Calculates total cart weight in grams.
 */
export function calculateCartWeightGrams(
  items: Array<{
    quantity: number;
    weightGrams: number | null | undefined;
    categorySlugs: string[];
  }>,
): number {
  return items.reduce(
    (sum, item) =>
      sum + getProductWeightGrams(item.weightGrams, item.categorySlugs) * item.quantity,
    0,
  );
}

/**
 * Returns the shipping zone for a given ISO country code.
 * Tries exact match first; falls back to the "Rest of World" zone
 * (the zone with an empty countries array).
 */
export function getZoneForCountry(
  country: string,
  zones: ShippingZone[],
): ShippingZone | null {
  const upper = country.toUpperCase();
  return (
    zones.find((z) => z.countries.includes(upper)) ??
    zones.find((z) => z.countries.length === 0) ??
    null
  );
}

/**
 * Looks up the CTT rate for a given service and weight.
 * Returns price_cents for the first tier whose max_weight_grams >= totalGrams.
 * Returns null if no tier covers the weight (order too heavy for CTT).
 */
export function getCttRateForWeight(
  cttRates: CttRate[],
  service: ShippingService,
  totalGrams: number,
): number | null {
  const tiers = cttRates
    .filter((r) => r.service === service)
    .sort((a, b) => a.max_weight_grams - b.max_weight_grams);

  const tier = tiers.find((r) => totalGrams <= r.max_weight_grams);
  return tier?.price_cents ?? null;
}

/**
 * Returns true when the zone covers Portugal (contains "PT").
 * Used to decide whether to apply CTT rates vs flat+weight formula.
 */
export function isPortugalZone(zone: ShippingZone): boolean {
  return zone.countries.includes("PT");
}

/**
 * Calculates the final shipping cost for an order.
 *
 * - For the Portugal zone: uses CTT rates table for the requested service.
 * - For all other zones: uses flat_rate_cents + weight_rate_cents_per_kg × kg.
 *
 * freeThresholdCents = 0 means the feature is disabled.
 * Returns shippingCents for the requested service.
 */
export function calculateShipping({
  subtotalCents,
  totalWeightGrams,
  zone,
  freeThresholdCents,
  cttRates,
  service = "normal",
}: {
  subtotalCents: number;
  totalWeightGrams: number;
  zone: ShippingZone;
  freeThresholdCents: number;
  cttRates: CttRate[];
  service?: ShippingService;
}): {
  shippingCents: number;
  isFree: boolean;
  amountAwayFromFreeCents: number;
} {
  const isFree =
    freeThresholdCents > 0 && subtotalCents >= freeThresholdCents;

  const amountAwayFromFreeCents =
    freeThresholdCents > 0
      ? Math.max(0, freeThresholdCents - subtotalCents)
      : 0;

  if (isFree) {
    return { shippingCents: 0, isFree: true, amountAwayFromFreeCents: 0 };
  }

  let shippingCents: number;

  if (isPortugalZone(zone)) {
    const rate = getCttRateForWeight(cttRates, service, totalWeightGrams);
    // If weight exceeds all CTT tiers, fall back to the heaviest tier price.
    shippingCents =
      rate ??
      Math.max(
        ...cttRates
          .filter((r) => r.service === service)
          .map((r) => r.price_cents),
        0,
      );
  } else {
    const totalWeightKg = totalWeightGrams / 1000;
    shippingCents =
      zone.flat_rate_cents +
      Math.round(zone.weight_rate_cents_per_kg * totalWeightKg);
  }

  return { shippingCents, isFree: false, amountAwayFromFreeCents };
}

/**
 * Calculates both CTT Normal and Expresso prices for a Portugal order.
 * Returns null for each if outside CTT weight limits.
 */
export function calculatePortugalShippingOptions(
  totalWeightGrams: number,
  cttRates: CttRate[],
): { normalCents: number | null; expressoCents: number | null } {
  return {
    normalCents: getCttRateForWeight(cttRates, "normal", totalWeightGrams),
    expressoCents: getCttRateForWeight(cttRates, "expresso", totalWeightGrams),
  };
}

/**
 * Returns the active free shipping threshold in cents.
 *
 * Priority: lowest threshold across live events that have one set → global setting.
 * Returns 0 if no threshold is configured (= feature disabled).
 */
export async function getActiveFreeShippingThreshold(
  supabase: SupabaseClient,
): Promise<number> {
  const { data: events } = await supabase
    .from("events")
    .select("free_shipping_threshold_cents")
    .eq("status", "live")
    .not("free_shipping_threshold_cents", "is", null)
    .order("free_shipping_threshold_cents", { ascending: true })
    .limit(1);

  if (events?.[0]?.free_shipping_threshold_cents != null) {
    return events[0].free_shipping_threshold_cents as number;
  }

  const { data: settings } = await supabase
    .from("shipping_settings")
    .select("global_free_shipping_threshold_cents")
    .eq("id", "default")
    .single();

  return settings?.global_free_shipping_threshold_cents ?? 0;
}
