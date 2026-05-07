import { requireAnyAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import NailProductManager from "@/components/admin/nails/NailProductManager";
import type { NailProduct } from "@/lib/types";

export default async function AdminNailProductsPage() {
  await requireAnyAdminRole();
  const supabase = await createClient();

  const { data } = await supabase
    .from("nail_products")
    .select("*")
    .order("created_at", { ascending: false });

  const products = (data ?? []) as NailProduct[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Nail Products</h1>
        <p className="text-sm text-zinc-500">Ready-made press-on sets available in the shop.</p>
      </div>
      <NailProductManager initialProducts={products} />
    </div>
  );
}
