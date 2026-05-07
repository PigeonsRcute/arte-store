import Link from "next/link";
import { requireAnyAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NailCustomOrder } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  quote_pending: "Quote pending", quoted: "Quote sent",
  confirmed: "Confirmed", in_progress: "In progress",
  shipped: "Shipped", cancelled: "Cancelled",
};
const FINISH_LABEL: Record<string, string> = {
  glossy_top_coat: "Glossy Top Coat",
  matte_top_coat: "Matte Top Coat",
  glittery_top_coat: "Glittery Top Coat",
  silvery_top_coat: "Silvery Top Coat",
};

const STATUS_COLOR: Record<string, string> = {
  quote_pending: "bg-yellow-100 text-yellow-700",
  quoted: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  in_progress: "bg-fuchsia-100 text-fuchsia-700",
  shipped: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

export default async function AdminCustomOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAnyAdminRole();
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("nail_custom_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data: ordersData, error } = await query;
  if (error) console.error("[admin/nails/custom-orders]", error.message, error.details);

  const rawOrders = (ordersData ?? []) as NailCustomOrder[];

  // Fetch profiles separately — avoids PostgREST join inference on the user_id FK.
  const userIds = [...new Set(rawOrders.map((o) => o.user_id))];
  const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, { full_name: p.full_name as string | null, email: p.email as string | null });
    }
  }

  const orders = rawOrders.map((o) => ({ ...o, profiles: profileMap.get(o.user_id) ?? null }));

  const activeStatus = status ?? "all";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Custom Orders</h1>
        <p className="text-sm text-zinc-500">Review requests, send quotes, update status.</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {["all", ...Object.keys(STATUS_LABEL)].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/nails/custom-orders" : `/admin/nails/custom-orders?status=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition capitalize ${
              activeStatus === s
                ? "bg-fuchsia-500 text-white"
                : "bg-white ring-1 ring-zinc-200 text-zinc-600 hover:ring-fuchsia-300"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Orders table */}
      <div className="rounded-2xl bg-white ring-1 ring-zinc-200 overflow-hidden">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-zinc-400">No orders found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Specs</th>
                <th className="px-4 py-3">Est. price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-800">{o.profiles?.full_name ?? "—"}</p>
                    <p className="text-xs text-zinc-400">{o.profiles?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-zinc-600">
                    {o.shape} · {o.length.replace("_", " ")} · {FINISH_LABEL[o.finish] ?? o.finish.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    {o.calculated_price_cents
                      ? `$${(o.calculated_price_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLOR[o.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/nails/custom-orders/${o.id}`} className="text-xs font-semibold text-fuchsia-600 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
