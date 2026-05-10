import { createClient } from "@/lib/supabase/server";
import ShippingZonesManager from "@/components/admin/shipping/ShippingZonesManager";
import CttRatesManager from "@/components/admin/shipping/CttRatesManager";
import ShippingAdminTabs from "@/components/admin/shipping/ShippingAdminTabs";
import type { CttRate, ShippingSettings, ShippingZone } from "@/lib/types";

export const metadata = { title: "Shipping — Admin" };

export default async function AdminShippingPage() {
  const supabase = await createClient();

  const [zonesResult, settingsResult, cttRatesResult] = await Promise.all([
    supabase.from("shipping_zones").select("*"),
    supabase.from("shipping_settings").select("*").eq("id", "default").single(),
    supabase.from("ctt_rates").select("*").order("service").order("max_weight_grams"),
  ]);

  const settings: ShippingSettings = settingsResult.data ?? {
    id: "default",
    global_free_shipping_threshold_cents: 0,
    default_shipping_service: "normal",
  };

  return (
    <section className="space-y-6 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-sky-300">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-sky-700">
          Shipping
        </h1>
        <p className="text-sm text-zinc-500">
          Configure shipping zones, CTT Portugal rates, and free shipping settings.
          Changes take effect immediately.
        </p>
      </div>

      <ShippingAdminTabs
        zonesPanel={
          <ShippingZonesManager
            initialZones={(zonesResult.data ?? []) as ShippingZone[]}
            initialSettings={settings}
          />
        }
        cttPanel={
          <CttRatesManager
            initialRates={(cttRatesResult.data ?? []) as CttRate[]}
            initialSettings={settings}
          />
        }
      />
    </section>
  );
}
