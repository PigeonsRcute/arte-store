import type { Product, SaleEvent, SalePrice } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type EventProductRow = { event_id: string; product_id: string; discount_value: number | null };
type EventCategoryRow = { event_id: string; category_id: string; discount_value: number | null };
type ProductCategoryRow = { product_id: string; category_id: string };

export type SalePriceMap = Record<string, SalePrice>; // product_id → SalePrice

/**
 * Given a list of products and a Supabase client, fetch all live events
 * and return a map of product_id → SalePrice for any affected products.
 */
export async function buildSalePriceMap(
  supabase: SupabaseClient,
  products: Pick<Product, "id" | "price_cents">[]
): Promise<SalePriceMap> {
  if (products.length === 0) return {};

  const productIds = products.map((p) => p.id);

  const [eventsRes, eventProductsRes, eventCategoriesRes, productCategoriesRes] = await Promise.all([
    supabase.from("events").select("*").eq("status", "live"),
    supabase.from("event_products").select("event_id, product_id, discount_value").in("product_id", productIds),
    supabase.from("event_categories").select("event_id, category_id, discount_value"),
    supabase.from("product_categories").select("product_id, category_id").in("product_id", productIds),
  ]);

  const liveEvents: SaleEvent[] = eventsRes.data ?? [];
  if (liveEvents.length === 0) return {};

  const eventProducts: EventProductRow[] = eventProductsRes.data ?? [];
  const eventCategories: EventCategoryRow[] = eventCategoriesRes.data ?? [];
  const productCategories: ProductCategoryRow[] = productCategoriesRes.data ?? [];

  // Build a lookup: product_id → category_ids[]
  const productCatMap: Record<string, string[]> = {};
  for (const pc of productCategories) {
    if (!productCatMap[pc.product_id]) productCatMap[pc.product_id] = [];
    productCatMap[pc.product_id].push(pc.category_id);
  }

  const result: SalePriceMap = {};

  for (const product of products) {
    let bestSalePrice: SalePrice | null = null;
    const productCatIds = productCatMap[product.id] ?? [];

    for (const event of liveEvents) {
      // Check direct product assignment
      const directMatch = eventProducts.find(
        (ep) => ep.event_id === event.id && ep.product_id === product.id
      );
      // Check category assignment
      const catMatch = eventCategories.find(
        (ec) => ec.event_id === event.id && productCatIds.includes(ec.category_id)
      );

      if (!directMatch && !catMatch) continue;

      // Per-product override > per-category override > event default
      const rawValue =
        directMatch?.discount_value ??
        catMatch?.discount_value ??
        event.discount_value;

      const saleCents = computeSaleCents(product.price_cents, event.discount_type, rawValue);

      // Pick the best deal (lowest sale price)
      if (!bestSalePrice || saleCents < bestSalePrice.sale_cents) {
        bestSalePrice = {
          original_cents: product.price_cents,
          sale_cents: Math.max(0, saleCents),
          discount_type: event.discount_type,
          discount_value: rawValue,
          event_name: event.name,
        };
      }
    }

    if (bestSalePrice) {
      result[product.id] = bestSalePrice;
    }
  }

  return result;
}

function computeSaleCents(
  priceCents: number,
  type: "percent" | "fixed",
  value: number
): number {
  if (type === "percent") {
    return Math.round(priceCents * (1 - value / 100));
  }
  return priceCents - Math.round(value * 100);
}
