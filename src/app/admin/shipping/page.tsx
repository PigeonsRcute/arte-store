import { createClient } from "@/lib/supabase/server";
import ShippingZonesManager from "@/components/admin/shipping/ShippingZonesManager";
import type { ShippingZone, ShippingSettings } from "@/lib/types";

export const metadata = { title: "Shipping — Admin" };

export default async function AdminShippingPage() {
  const supabase = await createClient();

  const [zonesResult, settingsResult] = await Promise.all([
    supabase.from("shipping_zones").select("*"),
    supabase
      .from("shipping_settings")
      .select("*")
      .eq("id", "default")
      .single(),
  ]);

  return (
    <section className="space-y-6 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-sky-300">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-sky-700">
          Shipping
        </h1>
        <p className="text-sm text-zinc-500">
          Configure shipping zones, rates, and the global free shipping
          threshold. Changes take effect immediately.
        </p>
      </div>

      <ShippingZonesManager
        initialZones={(zonesResult.data ?? []) as ShippingZone[]}
        initialSettings={
          (settingsResult.data ?? {
            id: "default",
            global_free_shipping_threshold_cents: 0,
          }) as ShippingSettings
        }
      />
    </section>
  );
}
