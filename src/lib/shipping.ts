import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShippingZone } from "@/lib/types";

// Category slug → weight in kg.
// Only categories that deviate from the default need an entry here.
const CATEGORY_WEIGHTS: Record<string, number> = {
  stickers: 0.1,
  prints:   0.3,
  keychains: 0.2,
};
const DEFAULT_WEIGHT_KG = 0.3;

/**
 * Returns the shipping weight for a product given its category slugs.
 * Uses the first slug that has an explicit weight mapping; falls back to default.
 */
export function getProductWeightKg(categorySlugs: string[]): number {
  for (const slug of categorySlugs) {
    if (slug in CATEGORY_WEIGHTS) return CATEGORY_WEIGHTS[slug];
  }
  return DEFAULT_WEIGHT_KG;
}

/**
 * Returns the shipping zone for a given ISO country code.
 * Tries exact match first; falls back to the "Rest of World" zone
 * (the zone with an empty countries array).
 */
export function getZoneForCountry(
  country: string,
  zones: ShippingZone[]
): ShippingZone | null {
  const upper = country.toUpperCase();
  return (
    zones.find((z) => z.countries.includes(upper)) ??
    zones.find((z) => z.countries.length === 0) ??
    null
  );
}

/**
 * Calculates total cart weight in kg from items with resolved category slugs.
 */
export function calculateCartWeightKg(
  items: Array<{ quantity: number; categorySlugs: string[] }>
): number {
  return items.reduce(
    (sum, item) => sum + getProductWeightKg(item.categorySlugs) * item.quantity,
    0,
  );
}

/**
 * Calculates the final shipping cost for an order.
 *
 * freeThresholdCents = 0 means the feature is disabled.
 */
export function calculateShipping({
  subtotalCents,
  totalWeightKg,
  zone,
  freeThresholdCents,
}: {
  subtotalCents: number;
  totalWeightKg: number;
  zone: ShippingZone;
  freeThresholdCents: number;
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

  const shippingCents =
    zone.flat_rate_cents +
    Math.round(zone.weight_rate_cents_per_kg * totalWeightKg);

  return { shippingCents, isFree: false, amountAwayFromFreeCents };
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
