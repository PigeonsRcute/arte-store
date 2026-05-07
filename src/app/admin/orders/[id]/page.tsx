"use server";

import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import DeliveryTimelineEditor from "@/components/orders/DeliveryTimelineEditor";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const ALL_STATUSES = ["pending", "paid", "fulfilled", "cancelled"] as const;
type OrderStatus = (typeof ALL_STATUSES)[number];

async function updateOrderStatus(orderId: string, formData: FormData) {
  "use server";
  const status = formData.get("status") as OrderStatus;
  if (!ALL_STATUSES.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, subtotal_cents, shipping_cents, total_cents, paypal_order_id, paypal_capture_id, is_test_order, delivery_steps, shipping_name, shipping_street, shipping_city, shipping_postal_code, shipping_country, created_at, user_id")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, quantity, unit_price_cents, product_id, products(title, image_url)")
    .eq("order_id", id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", order.user_id)
    .single();

  const updateThisOrder = updateOrderStatus.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-sm font-semibold text-zinc-400 hover:text-zinc-700">
          ← Orders
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-mono text-sm text-zinc-500">{id.slice(0, 8)}…</span>
      </div>

      <section className="rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-green-200 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-green-700">Order Detail</h1>
            <p className="mt-1 font-mono text-sm text-zinc-400">{id}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.is_test_order && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-black tracking-wider text-orange-600">
                TEST
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-sm font-black capitalize ${STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Customer</p>
            <p className="mt-1 font-semibold text-zinc-800">{profile?.full_name ?? "Unknown"}</p>
          </div>
          <div>
            <p className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Date</p>
            <p className="mt-1 text-zinc-700">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-bold text-zinc-400 uppercase text-xs tracking-wider">Total</p>
            <p className="mt-1 text-xl font-black text-zinc-900">${((order.total_cents ?? 0) / 100).toFixed(2)}</p>
            <p className="text-xs text-zinc-400">
              Subtotal ${((order.subtotal_cents ?? 0) / 100).toFixed(2)} + Shipping ${((order.shipping_cents ?? 0) / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* PayPal IDs */}
        {(order.paypal_order_id || order.paypal_capture_id) && (
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            {order.paypal_order_id && (
              <div>
                <p className="font-bold text-zinc-400 uppercase text-xs tracking-wider">PayPal Order ID</p>
                <p className="mt-1 font-mono text-xs text-zinc-500 break-all">{order.paypal_order_id}</p>
              </div>
            )}
            {order.paypal_capture_id && (
              <div>
                <p className="font-bold text-zinc-400 uppercase text-xs tracking-wider">PayPal Capture ID</p>
                <p className="mt-1 font-mono text-xs text-zinc-500 break-all">{order.paypal_capture_id}</p>
              </div>
            )}
          </div>
        )}

        {/* Shipping address */}
        {order.shipping_street && (
          <div>
            <p className="mb-1 font-bold text-zinc-400 uppercase text-xs tracking-wider">Ships To</p>
            <div className="text-sm text-zinc-600">
              {order.shipping_name && <p className="font-semibold">{order.shipping_name}</p>}
              <p>{order.shipping_street}</p>
              <p>{[order.shipping_city, order.shipping_postal_code, order.shipping_country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
        )}

        {/* Line Items */}
        <div>
          <p className="mb-3 font-bold text-zinc-400 uppercase text-xs tracking-wider">Items</p>
          {(items ?? []).length === 0 ? (
            <p className="text-sm text-zinc-400">No items recorded.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
              {(items ?? []).map((item) => {
                const product = Array.isArray(item.products) ? item.products[0] : item.products;
                return (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-zinc-800">{product?.title ?? "Unknown product"}</p>
                      <p className="text-xs text-zinc-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-zinc-900">
                      ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Status Update */}
        <div>
          <p className="mb-3 font-bold text-zinc-400 uppercase text-xs tracking-wider">Update Status</p>
          <form action={updateThisOrder} className="flex flex-wrap items-center gap-3">
            <select
              name="status"
              defaultValue={order.status}
              className="rounded-xl border-2 border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 focus:border-green-400 focus:outline-none"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
            >
              Save
            </button>
          </form>
        </div>
      </section>

      <DeliveryTimelineEditor
        orderId={id}
        initialSteps={order.delivery_steps ?? []}
      />
    </div>
  );
}
