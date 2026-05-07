import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAnyAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CustomOrderDetail from "@/components/admin/nails/CustomOrderDetail";
import type { NailCustomOrder } from "@/lib/types";

export default async function AdminCustomOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAnyAdminRole();
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nail_custom_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("[admin/nails/custom-orders/[id]]", error.code, error.message);
  if (!data) notFound();

  // Fetch profile separately — PostgREST cannot reliably follow the user_id FK
  // across the auth.users → profiles boundary, so we avoid the join.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", data.user_id)
    .maybeSingle();

  // Fetch sizing submission linked to this order (or by user)
  const { data: sizing } = await supabase
    .from("nail_sizing_submissions")
    .select("sizes, submitted_at")
    .eq("user_id", data.user_id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Resolve extras UUIDs → human-readable names
  let extraNames: string[] = [];
  if (Array.isArray(data.extras) && data.extras.length > 0) {
    const { data: extrasData } = await supabase
      .from("nail_extras")
      .select("id, name")
      .in("id", data.extras as string[]);
    if (extrasData) {
      const nameMap = new Map((extrasData as { id: string; name: string }[]).map((e) => [e.id, e.name]));
      extraNames = (data.extras as string[]).map((id) => nameMap.get(id) ?? id);
    }
  }

  const order = { ...data, profiles: profile ?? null } as NailCustomOrder & {
    profiles: { full_name: string | null; email: string | null } | null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/nails/custom-orders" className="text-sm text-zinc-400 hover:text-zinc-700">
          ← Custom Orders
        </Link>
      </div>
      <CustomOrderDetail order={order} sizing={sizing} extraNames={extraNames} />
    </div>
  );
}
