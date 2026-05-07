import { requireAnyAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PricingManager from "@/components/admin/nails/PricingManager";
import type { NailPricingRule, NailExtra } from "@/lib/types";

export default async function AdminPricingPage() {
  await requireAnyAdminRole();
  const supabase = await createClient();

  const [{ data: rulesRaw }, { data: extrasRaw }] = await Promise.all([
    supabase.from("nail_pricing_rules").select("*").order("shape").order("length"),
    supabase.from("nail_extras").select("*").order("name"),
  ]);

  const rules = (rulesRaw ?? []) as NailPricingRule[];
  const extras = (extrasRaw ?? []) as NailExtra[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Pricing</h1>
        <p className="text-sm text-zinc-500">Base prices per shape + length, plus extras costs.</p>
      </div>
      <PricingManager initialRules={rules} initialExtras={extras} />
    </div>
  );
}
