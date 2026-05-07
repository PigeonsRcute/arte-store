import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: PageProps) {

  const { id } = await params;
  const supabase = await createClient();

  const [profileResult, ordersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, street, city, postal_code, country, role, created_at")
      .eq("id", id)
      .eq("role", "customer")
      .single(),
    supabase
      .from("orders")
      .select("id, status, total_cents, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || !profileResult.data) notFound();

  const customer = profileResult.data;
  const orders = ordersResult.data ?? [];

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    fulfilled: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 transition hover:text-pink-600"
      >
        ← All Customers
      </Link>

      {/* Profile card */}
      <section className="rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-yellow-300">
        <h1 className="mb-4 text-2xl font-black tracking-tight text-yellow-700">
          {customer.full_name ?? "Unnamed Customer"}
        </h1>

        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Email</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-700">
              {customer.email ?? <span className="text-zinc-400 font-normal">—</span>}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Member Since</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-700">
              {new Date(customer.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Shipping Address</p>
            {customer.street || customer.city || customer.postal_code || customer.country ? (
              <address className="mt-0.5 text-sm not-italic text-zinc-700 leading-relaxed">
                {customer.street && <span className="block">{customer.street}</span>}
                {(customer.city || customer.postal_code) && (
                  <span className="block">
                    {[customer.city, customer.postal_code].filter(Boolean).join(", ")}
                  </span>
                )}
                {customer.country && <span className="block">{customer.country}</span>}
              </address>
            ) : (
              <p className="mt-0.5 text-sm text-zinc-400">No address on file</p>
            )}
          </div>
        </div>
      </section>

      {/* Orders */}
      <section className="rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-pink-200">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-black tracking-tight text-pink-700">Order History</h2>
          <span className="text-sm text-zinc-400">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-zinc-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-100 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-500">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="py-3 pr-4 text-zinc-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${
                          STATUS_COLORS[order.status] ?? "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-zinc-800">
                      ${(order.total_cents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
