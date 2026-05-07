import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { NailCustomOrder } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  quote_pending: "Quote pending",
  quoted: "Quote sent",
  confirmed: "Confirmed",
  in_progress: "In progress",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  quote_pending: "bg-yellow-100 text-yellow-700",
  quoted: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  in_progress: "bg-fuchsia-100 text-fuchsia-700",
  shipped: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

export default async function NailOrdersPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?reason=signin_required&next=/nails/orders");

  const { data } = await supabase
    .from("nail_custom_orders")
    .select("*")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as NailCustomOrder[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-1 text-xs font-bold tracking-widest text-fuchsia-400">MY ACCOUNT</p>
        <h1 className="text-3xl font-black text-zinc-800">My Nail Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/60 py-24 text-center ring-1 ring-pink-100">
          <span className="text-5xl">💅</span>
          <p className="font-semibold text-zinc-500">No orders yet.</p>
          <div className="flex gap-3">
            <Link
              href="/nails/shop"
              className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white"
            >
              Shop sets
            </Link>
            <Link
              href="/nails/custom"
              className="rounded-full border border-fuchsia-200 px-6 py-2 text-sm font-semibold text-fuchsia-700 hover:bg-fuchsia-50"
            >
              Design custom
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white/80 p-6 ring-1 ring-pink-100 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-zinc-400">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                  <p className="font-bold text-zinc-800 capitalize">
                    {order.shape} · {order.length.replace("_", " ")} · {order.finish}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[order.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              {order.final_price_cents && (
                <p className="text-sm font-semibold text-zinc-600">
                  Quote:{" "}
                  <span className="text-fuchsia-700 font-black">
                    ${(order.final_price_cents / 100).toFixed(2)}
                  </span>
                </p>
              )}

              {order.admin_notes && (
                <div className="rounded-xl bg-fuchsia-50 p-3 text-sm text-fuchsia-800 ring-1 ring-fuchsia-100">
                  <span className="font-bold">Note from studio: </span>
                  {order.admin_notes}
                </div>
              )}

              <Link
                href={`/nails/orders/${order.id}`}
                className="self-start text-xs font-semibold text-fuchsia-600 hover:underline"
              >
                View details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
