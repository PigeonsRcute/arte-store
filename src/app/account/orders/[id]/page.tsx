import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";
import OrderTracker from "@/components/orders/OrderTracker";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/account?reason=signin_required");

  const [orderResult, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", authData.user.id)
      .single(),
    supabase
      .from("order_items")
      .select("*, products(id, title, slug, image_url, image_urls)")
      .eq("order_id", id),
  ]);

  if (!orderResult.data) notFound();

  const order = orderResult.data as Order;
  const items = (itemsResult.data ?? []) as OrderItem[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/account/orders"
            className="text-sm font-semibold text-zinc-400 transition hover:text-zinc-700"
          >
            ← My Orders
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-mono text-sm text-zinc-500">
            {id.slice(0, 8)}…
          </span>
          {order.is_test_order && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-orange-500">
              Test Order
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Order header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-2 ring-zinc-100">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Order placed
              </p>
              <p className="mt-1 font-semibold text-zinc-700">
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-black capitalize ${STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"}`}
            >
              {order.status}
            </span>
          </div>

          {/* Items */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-zinc-100">
            <h2 className="mb-4 font-black text-zinc-700">Items</h2>
            <ul className="divide-y divide-zinc-100">
              {items.map((item) => {
                const product = item.products;
                const heroImage =
                  product?.image_urls?.[0] ?? product?.image_url;
                return (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      {heroImage ? (
                        <Image
                          src={heroImage}
                          alt={product?.title ?? ""}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-4">
                      <div>
                        {product?.slug ? (
                          <Link
                            href={`/products/${product.slug}`}
                            className="font-semibold text-zinc-800 hover:text-pink-600"
                          >
                            {product.title}
                          </Link>
                        ) : (
                          <p className="font-semibold text-zinc-800">
                            {product?.title ?? "Unknown product"}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400">
                          Qty: {item.quantity} ·{" "}
                          ${(item.unit_price_cents / 100).toFixed(2)} each
                        </p>
                      </div>
                      <p className="font-black text-zinc-900">
                        $
                        {(
                          (item.unit_price_cents * item.quantity) /
                          100
                        ).toFixed(2)}
                      </p>
                    </div>
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
                <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Shipping</span>
                <span>
                  {order.shipping_cents === 0
                    ? "Free"
                    : `$${(order.shipping_cents / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-zinc-100 pt-2">
                <span className="font-black text-zinc-900">Total</span>
                <span className="text-xl font-black text-red-600">
                  ${(order.total_cents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shipping_street && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-zinc-100">
              <h2 className="mb-2 font-black text-zinc-700">Ships To</h2>
              <div className="text-sm text-zinc-600">
                {order.shipping_name && (
                  <p className="font-semibold">{order.shipping_name}</p>
                )}
                <p>{order.shipping_street}</p>
                <p>
                  {[
                    order.shipping_city,
                    order.shipping_postal_code,
                    order.shipping_country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Delivery tracking — animated road visualization + timeline */}
          <OrderTracker orderId={id} initialDeliverySteps={order.delivery_steps} />
        </div>
      </div>
    </div>
  );
}
