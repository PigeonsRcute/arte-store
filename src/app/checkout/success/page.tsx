import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";

type SuccessPageProps = {
  searchParams: Promise<{ order?: string; paypal_order?: string }>;
};

async function getOrderData(
  orderId: string | undefined,
  paypalOrderId: string | undefined,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  if (!orderId && !paypalOrderId) return null;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const query = supabase
    .from("orders")
    .select("*")
    .eq("user_id", authData.user.id);

  const { data: order } = orderId
    ? await query.eq("id", orderId).single()
    : await query.eq("paypal_order_id", paypalOrderId!).single();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*, products(id, title, image_url, image_urls, slug)")
    .eq("order_id", order.id);

  return { order: order as Order, items: (items ?? []) as OrderItem[] };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { order: orderId, paypal_order: paypalOrderId } = await searchParams;
  const data = await getOrderData(orderId, paypalOrderId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Success banner */}
        <div className="mb-8 rounded-3xl bg-emerald-50 p-8 text-center ring-2 ring-emerald-200">
          <div className="mb-3 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">
              ✓
            </span>
          </div>
          <h1 className="text-3xl font-black text-emerald-700">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-zinc-600">
            Thank you for your purchase. You'll receive a confirmation email
            shortly.
          </p>
          {data?.order.id && (
            <p className="mt-3 font-mono text-xs text-zinc-400">
              Order ID: {data.order.id}
            </p>
          )}
        </div>

        {data ? (
          <div className="space-y-4">
            {/* Items */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-zinc-100">
              <h2 className="mb-4 font-black text-zinc-700">Items Ordered</h2>
              <ul className="divide-y divide-zinc-100">
                {data.items.map((item) => {
                  const product = item.products;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-zinc-800">
                          {product?.title ?? "Unknown product"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-zinc-900">
                        ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Totals */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-zinc-100">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>${(data.order.subtotal_cents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Shipping</span>
                  <span>
                    {data.order.shipping_cents === 0
                      ? "Free"
                      : `$${(data.order.shipping_cents / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between border-t-2 border-zinc-100 pt-2">
                  <span className="font-black text-zinc-900">Total</span>
                  <span className="text-xl font-black text-red-600">
                    ${(data.order.total_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            {data.order.shipping_street && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-zinc-100">
                <h2 className="mb-2 font-black text-zinc-700">Ships To</h2>
                <div className="text-sm text-zinc-600">
                  {data.order.shipping_name && (
                    <p className="font-semibold">{data.order.shipping_name}</p>
                  )}
                  <p>{data.order.shipping_street}</p>
                  <p>
                    {[
                      data.order.shipping_city,
                      data.order.shipping_postal_code,
                      data.order.shipping_country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-2 ring-zinc-100">
            <p className="text-sm text-zinc-500">
              Order details could not be loaded.{" "}
              <Link
                href="/account/orders"
                className="font-semibold text-pink-600 hover:underline"
              >
                View your orders
              </Link>
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/account/orders"
            className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-black text-white transition hover:bg-zinc-700"
          >
            View All Orders
          </Link>
          <Link
            href="/shop"
            className="rounded-2xl bg-yellow-300 px-6 py-3 text-sm font-black text-zinc-900 transition hover:bg-yellow-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
