import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const LINKS = [
  { href: "/admin",            label: "Dashboard" },
  { href: "/admin/products",   label: "Products" },
  { href: "/admin/orders",     label: "Orders" },
  { href: "/admin/customers",  label: "Customers" },
  { href: "/admin/revenue",    label: "Revenue" },
  { href: "/admin/analytics",  label: "Analytics" },
];

export default async function AdminBar() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const adminRoles = ["owner", "editor", "support", "viewer", "nails_admin"];
  if (!adminRoles.includes(profile?.role ?? "")) return null;

  return (
    <div className="w-full border-b-2 border-[#1A1A1A] bg-white px-6 py-1.5">
      <div className="mx-auto flex max-w-6xl items-center gap-1">
        <span className="mr-4 font-mono text-xs font-black uppercase tracking-widest text-[#FF3B3B]">
          ⚙ Admin
        </span>
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-3 py-1 font-mono text-xs font-bold text-[#6B6B6B] transition-colors hover:bg-[#FFD600] hover:text-[#1A1A1A]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
