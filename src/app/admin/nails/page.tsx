import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAnyAdminRole } from "@/lib/auth";

const SECTIONS = [
  { href: "/admin/nails/products",      label: "Products",      desc: "CRUD for ready-made nail sets", color: "bg-fuchsia-50 ring-fuchsia-200 text-fuchsia-700" },
  { href: "/admin/nails/custom-orders", label: "Custom Orders", desc: "Review, quote, and manage custom requests", color: "bg-pink-50 ring-pink-200 text-pink-700" },
  { href: "/admin/nails/sizing-kits",   label: "Sizing Kits",   desc: "View submitted per-finger measurements", color: "bg-violet-50 ring-violet-200 text-violet-700" },
  { href: "/admin/nails/materials",     label: "Materials",     desc: "Track material costs, suppliers, stock", color: "bg-purple-50 ring-purple-200 text-purple-700" },
  { href: "/admin/nails/pricing",       label: "Pricing",       desc: "Base prices per shape+length, extras costs", color: "bg-indigo-50 ring-indigo-200 text-indigo-700" },
];

export default async function AdminNailsPage() {
  await requireAnyAdminRole();
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: pendingCount },
    { count: kitCount },
  ] = await Promise.all([
    supabase.from("nail_products").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("nail_custom_orders").select("*", { count: "exact", head: true }).eq("status", "quote_pending"),
    supabase.from("nail_sizing_submissions").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Nails</h1>
        <p className="text-sm text-zinc-500">Manage the nails section of the store.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Published sets", value: productCount ?? 0 },
          { label: "Pending quotes", value: pendingCount ?? 0, alert: (pendingCount ?? 0) > 0 },
          { label: "Size submissions", value: kitCount ?? 0 },
        ].map(({ label, value, alert }) => (
          <div key={label} className={`rounded-2xl p-5 ring-1 ${alert ? "bg-pink-50 ring-pink-300" : "bg-white ring-zinc-200"}`}>
            <p className={`text-3xl font-black ${alert ? "text-pink-600" : "text-zinc-800"}`}>{value}</p>
            <p className="text-xs font-semibold text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Section links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ href, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-2xl p-5 ring-1 transition hover:shadow-md ${color}`}
          >
            <h2 className="font-black text-lg">{label}</h2>
            <p className="text-sm opacity-70 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
