import { requireAnyAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MaterialsManager from "@/components/admin/nails/MaterialsManager";
import type { NailMaterial } from "@/lib/types";

export default async function AdminMaterialsPage() {
  await requireAnyAdminRole();
  const supabase = await createClient();

  const { data } = await supabase
    .from("nail_materials")
    .select("*")
    .order("name");

  const materials = (data ?? []) as NailMaterial[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Materials</h1>
        <p className="text-sm text-zinc-500">Track material costs, suppliers, and stock levels.</p>
      </div>
      <MaterialsManager initialMaterials={materials} />
    </div>
  );
}
