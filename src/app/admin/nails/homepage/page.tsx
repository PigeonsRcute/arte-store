import { createClient } from "@/lib/supabase/server";
import NailsHomepageEditor from "./NailsHomepageEditor";
import type { NailHomepageContent, SaleEvent } from "@/lib/types";
import type { PickerItem } from "@/components/admin/ProductPicker";

export const metadata = { title: "Nails Homepage Editor — Admin" };

export default async function AdminNailsHomepagePage() {
  const supabase = await createClient();

  const [sectionsResult, productsResult, eventsResult] = await Promise.all([
    supabase
      .from("nail_homepage_content")
      .select("*")
      .order("section"),
    supabase
      .from("nail_products")
      .select("id, name, images, price_cents")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, name, status, starts_at, banner_url")
      .in("status", ["live", "scheduled"])
      .order("starts_at", { ascending: true }),
  ]);

  if (sectionsResult.error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700 text-sm">
        Failed to load nails homepage content: {sectionsResult.error.message}
      </div>
    );
  }

  const nailProducts: PickerItem[] = (productsResult.data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    imageSrc: (p.images as string[])?.[0] ?? null,
    priceCents: p.price_cents,
  }));

  const saleEvents = (eventsResult.data ?? []) as SaleEvent[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Nails Homepage Editor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edit each section&apos;s content and toggle visibility. Saves instantly — no redeploy needed.
        </p>
      </div>
      <NailsHomepageEditor
        sections={(sectionsResult.data ?? []) as NailHomepageContent[]}
        nailProducts={nailProducts}
        saleEvents={saleEvents}
      />
    </div>
  );
}
