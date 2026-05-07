import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, street, city, postal_code, country, role, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const customers = profiles ?? [];

  const customerIds = customers.map((c) => c.id);
  const { data: orderCounts } = customerIds.length
    ? await supabase.from("orders").select("user_id").in("user_id", customerIds)
    : { data: [] };

  const countMap = (orderCounts ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.user_id] = (acc[o.user_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-yellow-300">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black tracking-tight text-yellow-700">Customers</h1>
        <span className="text-sm text-zinc-400">{customers.length} registered</span>
      </div>

      {customers.length === 0 ? (
        <p className="text-sm text-zinc-400">No customers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-100 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">City</th>
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="group hover:bg-zinc-50"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-semibold text-zinc-800 group-hover:text-pink-600 transition-colors"
                    >
                      {customer.full_name ?? <span className="text-zinc-400 font-normal">No name</span>}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-zinc-500">
                    {customer.email ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-zinc-500">
                    {customer.city ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-zinc-500">
                    {customer.country ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
                      {countMap[customer.id] ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
