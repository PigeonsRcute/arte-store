import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { capturePayPalOrder } from "@/lib/paypal";
import {
  getActiveFreeShippingThreshold,
  getZoneForCountry,
  calculateCartWeightKg,
  calculateShipping,
} from "@/lib/shipping";
import type { ShippingZone } from "@/lib/types";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/checkout?error=missing_token`);
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.redirect(`${baseUrl}/account?reason=signin_required`);
  }

  const userId = authData.user.id;

  // Read cart snapshot before doing anything irreversible
  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("id, quantity, products(id, title, price_cents, stock_quantity)")
    .eq("user_id", userId);

  if (!cartItems?.length) {
    return NextResponse.redirect(`${baseUrl}/cart`);
  }

  const items = cartItems.map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    return { cartItemId: item.id, quantity: item.quantity, product };
  });

  // Capture the payment with PayPal
  let capture: Awaited<ReturnType<typeof capturePayPalOrder>>;
  try {
    capture = await capturePayPalOrder(token);
  } catch (err) {
    console.error("PayPal capture error:", err);
    return NextResponse.redirect(`${baseUrl}/checkout?error=capture_failed`);
  }

  if (capture.status !== "COMPLETED") {
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=payment_${capture.status.toLowerCase()}`,
    );
  }

  const productIds = items.map((i) => i.product.id);

  // Fetch everything needed for consistent shipping recalculation in parallel
  const [profileResult, zonesResult, productCategoriesResult, freeThreshold] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, street, city, postal_code, country")
        .eq("id", userId)
        .single(),
      supabase.from("shipping_zones").select("*"),
      supabase
        .from("product_categories")
        .select("product_id, categories(slug)")
        .in("product_id", productIds),
      getActiveFreeShippingThreshold(supabase),
    ]);

  const profile = profileResult.data;
  const country = profile?.country ?? "";
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

  const adminSupabase = createAdminClient();

  // Create the order record
  const { data: order, error: orderError } = await adminSupabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "paid",
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: subtotalCents + shippingCents,
      paypal_order_id: token,
      paypal_capture_id: capture.captureId,
      shipping_name: profile?.full_name ?? null,
      shipping_street: profile?.street ?? null,
      shipping_city: profile?.city ?? null,
      shipping_postal_code: profile?.postal_code ?? null,
      shipping_country: profile?.country ?? null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Order DB insert failed:", orderError);
    return NextResponse.redirect(
      `${baseUrl}/checkout/success?paypal_order=${token}`,
    );
  }

  // Create order items, decrement stock, and clear cart in parallel
  await Promise.all([
    adminSupabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price_cents: i.product.price_cents,
        shipping_cost_cents: 0, // shipping is now per-order, not per-item
      })),
    ),
    ...items.map((i) =>
      adminSupabase
        .from("products")
        .update({
          stock_quantity: Math.max(0, i.product.stock_quantity - i.quantity),
        })
        .eq("id", i.product.id),
    ),
    adminSupabase.from("cart_items").delete().eq("user_id", userId),
  ]);

  return NextResponse.redirect(`${baseUrl}/checkout/success?order=${order.id}`);
}
