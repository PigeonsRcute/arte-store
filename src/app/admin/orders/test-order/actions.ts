"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveFreeShippingThreshold,
  getZoneForCountry,
  calculateCartWeightGrams,
  calculateShipping,
} from "@/lib/shipping";
import type { CttRate, ShippingZone } from "@/lib/types";

export async function createTestOrder(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not authenticated");

  const customerId = formData.get("customer_id") as string;
  const status = (formData.get("status") as string) || "paid";
  const shippingName = formData.get("shipping_name") as string;
  const shippingStreet = formData.get("shipping_street") as string;
  const shippingCity = formData.get("shipping_city") as string;
  const shippingPostalCode = formData.get("shipping_postal_code") as string;
  const shippingCountry = formData.get("shipping_country") as string;
  const itemsJson = formData.get("items") as string;

  if (!customerId || !itemsJson) throw new Error("Missing required fields");

  const items: Array<{ productId: string; quantity: number }> =
    JSON.parse(itemsJson);

  if (items.length === 0) throw new Error("No items selected");

  const adminSupabase = createAdminClient();
  const productIds = items.map((i) => i.productId);

  const [productsResult, zonesResult, cttRatesResult, productCategoriesResult, freeThreshold] =
    await Promise.all([
      adminSupabase
        .from("products")
        .select("id, price_cents, weight_grams")
        .in("id", productIds),
      adminSupabase.from("shipping_zones").select("*"),
      adminSupabase.from("ctt_rates").select("*").order("service").order("max_weight_grams"),
      adminSupabase
        .from("product_categories")
        .select("product_id, categories(slug)")
        .in("product_id", productIds),
      getActiveFreeShippingThreshold(supabase),
    ]);

  const productMap = Object.fromEntries(
    (productsResult.data ?? []).map((p) => [p.id, p]),
  );

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

  const subtotalCents = items.reduce((sum, i) => {
    return sum + (productMap[i.productId]?.price_cents ?? 0) * i.quantity;
  }, 0);

  const totalWeightGrams = calculateCartWeightGrams(
    items.map((i) => ({
      quantity: i.quantity,
      weightGrams: productMap[i.productId]?.weight_grams ?? null,
      categorySlugs: productCatSlugs[i.productId] ?? [],
    })),
  );

  const zone = shippingCountry
    ? getZoneForCountry(shippingCountry, zones)
    : (zones.find((z) => z.countries.length === 0) ?? null);

  let shippingCents = 0;
  if (zone) {
    ({ shippingCents } = calculateShipping({
      subtotalCents,
      totalWeightGrams,
      zone,
      freeThresholdCents: freeThreshold,
      cttRates,
      service: "normal",
    }));
  }

  const { data: order, error: orderError } = await adminSupabase
    .from("orders")
    .insert({
      user_id: customerId,
      status,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: subtotalCents + shippingCents,
      paypal_order_id: null,
      paypal_capture_id: null,
      is_test_order: true,
      shipping_name: shippingName || null,
      shipping_street: shippingStreet || null,
      shipping_city: shippingCity || null,
      shipping_postal_code: shippingPostalCode || null,
      shipping_country: shippingCountry || null,
      shipping_service: "normal",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message}`);
  }

  await adminSupabase.from("order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      quantity: i.quantity,
      unit_price_cents: productMap[i.productId]?.price_cents ?? 0,
      shipping_cost_cents: 0,
    })),
  );

  redirect(`/admin/orders/${order.id}`);
}
