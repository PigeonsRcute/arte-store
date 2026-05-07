import { createClient } from "@/lib/supabase/server";

async function getRevenueData() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_cents, status, created_at")
    .in("status", ["paid", "fulfilled"])
    .eq("is_test_order", false)
    .order("created_at", { ascending: true });

  const { data: topItems } = await supabase
    .from("order_items")
    .select("quantity, unit_price_cents, products(title), orders!inner(is_test_order, status)")
    .eq("orders.is_test_order", false)
    .in("orders.status", ["paid", "fulfilled"]);

  // Group revenue by month
  const byMonth: Record<string, number> = {};
  for (const order of orders ?? []) {
    const month = order.created_at.slice(0, 7); // "YYYY-MM"
    byMonth[month] = (byMonth[month] ?? 0) + order.total_cents;
  }

  // Top products by revenue
  const productRevenue: Record<string, { title: string; cents: number }> = {};
  for (const item of topItems ?? []) {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    if (!product?.title) continue;
    const key = product.title;
    productRevenue[key] = {
      title: key,
      cents: (productRevenue[key]?.cents ?? 0) + item.unit_price_cents * item.quantity,
    };
  }

  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 5);

  const totalCents = (orders ?? []).reduce((sum, o) => sum + o.total_cents, 0);
  const totalOrders = (orders ?? []).length;

  return { byMonth, topProducts, totalCents, totalOrders };
}

export default async function RevenuePage() {
  const { byMonth, topProducts, totalCents, totalOrders } = await getRevenueData();

  const months = Object.entries(byMonth);
  const maxCents = Math.max(...months.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-green-300">
          <p className="text-sm font-semibold text-zinc-500">Total Revenue</p>
          <p className="mt-1 text-4xl font-black text-green-700">
            ${(totalCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">paid + fulfilled orders</p>
        </div>
        <div className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-blue-300">
          <p className="text-sm font-semibold text-zinc-500">Orders Completed</p>
          <p className="mt-1 text-4xl font-black text-blue-700">{totalOrders}</p>
          <p className="mt-1 text-xs text-zinc-400">paid or fulfilled</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by month */}
        <section className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-green-200">
          <h2 className="mb-4 font-black text-green-700">Revenue by Month</h2>
          {months.length === 0 ? (
            <p className="text-sm text-zinc-400">No revenue data yet.</p>
          ) : (
            <div className="space-y-2">
              {months.map(([month, cents]) => (
                <div key={month}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-600">
                    <span>{month}</span>
                    <span>${(cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-100">
                    <div
                      className="h-3 rounded-full bg-green-400"
                      style={{ width: `${(cents / maxCents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top products */}
        <section className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-pink-200">
          <h2 className="mb-4 font-black text-pink-700">Top Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-zinc-400">No sales data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.title} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center font-black text-zinc-300">#{i + 1}</span>
                    <span className="font-semibold text-zinc-800">{p.title}</span>
                  </div>
                  <span className="font-black text-pink-700">${(p.cents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
