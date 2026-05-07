import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomOrderBuilder from "@/components/nails/CustomOrderBuilder";
import type { NailPricingRule, NailExtra } from "@/lib/types";

export default async function NailsCustomPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    redirect("/login?reason=signin_required&next=/nails/custom");
  }

  const [{ data: rulesRaw }, { data: extrasRaw }] = await Promise.all([
    supabase.from("nail_pricing_rules").select("*").order("shape").order("length"),
    supabase.from("nail_extras").select("*").eq("is_active", true).order("name"),
  ]);

  const pricingRules = (rulesRaw ?? []) as NailPricingRule[];
  const extras = (extrasRaw ?? []) as NailExtra[];

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <p className="mb-1 text-xs font-bold tracking-widest text-fuchsia-400">MADE FOR YOU</p>
        <h1 className="text-4xl font-black text-zinc-800">Design Your Custom Set</h1>
        <p className="mt-2 text-zinc-500">Build step by step — price updates as you go.</p>
      </div>

      <CustomOrderBuilder pricingRules={pricingRules} extras={extras} />
    </div>
  );
}
