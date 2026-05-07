import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_cents, status, created_at, user_id, is_test_order")
    .order("created_at", { ascending: false });

  // Fetch profiles for all users in these orders
  const userIds = [...new Set((orders ?? []).map((o) => o.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-green-300">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight text-green-700">Orders</h1>
        <Link
          href="/admin/orders/test-order"
          className="rounded-xl border-2 border-dashed border-orange-300 px-4 py-2 text-xs font-bold text-orange-600 hover:border-orange-400 hover:bg-orange-50"
        >
          + Create Test Order
        </Link>
      </div>

      {(orders ?? []).length === 0 ? (
        <p className="text-sm text-zinc-400">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-100 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Total</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(orders ?? []).map((order) => {
                const profile = profileMap[order.user_id];
                return (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-zinc-500">{order.id.slice(0, 8)}…</span>
                      {order.is_test_order && (
                        <span className="ml-2 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-orange-600">
                          TEST
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-zinc-700">
                      {profile?.full_name ?? <span className="text-zinc-400">Unknown</span>}
                    </td>
                    <td className="py-3 pr-4 text-zinc-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 font-bold text-zinc-900">
                      ${((order.total_cents ?? 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
