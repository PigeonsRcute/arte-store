import { createClient } from "@/lib/supabase/server";

async function getDashboardStats() {
  const supabase = await createClient();

  const [
    { count: totalProducts },
    { count: publishedProducts },
    { count: totalOrders },
    { data: ordersByStatus },
    { data: recentOrders },
    { data: lowStockProducts },
    { data: revenueData },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("is_test_order", false),
    supabase.from("orders").select("status").eq("is_test_order", false),
    supabase
      .from("orders")
      .select("id, total_cents, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id, title, stock_quantity")
      .lt("stock_quantity", 5)
      .eq("is_published", true)
      .order("stock_quantity", { ascending: true }),
    supabase.from("orders").select("total_cents").eq("status", "paid").or("status.eq.fulfilled").eq("is_test_order", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  const statusCounts = (ordersByStatus ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalRevenueCents = (revenueData ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);

  return {
    totalProducts: totalProducts ?? 0,
    publishedProducts: publishedProducts ?? 0,
    totalOrders: totalOrders ?? 0,
    totalCustomers: totalCustomers ?? 0,
    statusCounts,
    recentOrders: recentOrders ?? [],
    lowStockProducts: lowStockProducts ?? [],
    totalRevenueCents,
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function AdminPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={stats.totalProducts} sub={`${stats.publishedProducts} published`} color="pink" />
        <StatCard label="Total Orders" value={stats.totalOrders} sub={`${stats.statusCounts["pending"] ?? 0} pending`} color="blue" />
        <StatCard label="Revenue" value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} sub="paid + fulfilled orders" color="green" />
        <StatCard label="Customers" value={stats.totalCustomers} sub="registered accounts" color="yellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <section className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-blue-200">
          <h2 className="mb-4 font-black text-blue-700">Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-zinc-400">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-zinc-700">{new Date(order.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-zinc-400">{order.id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">${((order.total_cents ?? 0) / 100).toFixed(2)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low Stock */}
        <section className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-red-200">
          <h2 className="mb-4 font-black text-red-600">Low Stock</h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-zinc-400">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm">
                  <span className="font-semibold text-zinc-700">{p.title}</span>
                  <span className={`font-black ${p.stock_quantity === 0 ? "text-red-600" : "text-orange-500"}`}>
                    {p.stock_quantity === 0 ? "Out of stock" : `${p.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Order Status Breakdown */}
        <section className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-green-200 lg:col-span-2">
          <h2 className="mb-4 font-black text-green-700">Orders by Status</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["pending", "paid", "fulfilled", "cancelled"] as const).map((status) => (
              <div key={status} className={`rounded-xl px-4 py-3 text-center ${STATUS_COLORS[status]}`}>
                <p className="text-2xl font-black">{stats.statusCounts[status] ?? 0}</p>
                <p className="mt-0.5 text-xs font-bold capitalize">{status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: "pink" | "blue" | "green" | "yellow";
}) {
  const ring = {
    pink: "ring-pink-300",
    blue: "ring-blue-300",
    green: "ring-green-300",
    yellow: "ring-yellow-300",
  }[color];

  const textColor = {
    pink: "text-pink-700",
    blue: "text-blue-700",
    green: "text-green-700",
    yellow: "text-yellow-700",
  }[color];

  return (
    <div className={`rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ${ring}`}>
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className={`mt-1 text-3xl font-black ${textColor}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{sub}</p>
    </div>
  );
}
