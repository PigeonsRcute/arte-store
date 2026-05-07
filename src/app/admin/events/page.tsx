import { createClient } from "@/lib/supabase/server";
import EventManager from "@/components/admin/events/EventManager";

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const [eventsResult, categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, slug, gradient_from, gradient_to, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, title, image_url, is_published")
      .eq("is_published", true)
      .order("title", { ascending: true }),
  ]);

  // Fetch per-event product and category selections
  const { data: eventProducts } = await supabase
    .from("event_products")
    .select("event_id, product_id, discount_value");

  const { data: eventCategories } = await supabase
    .from("event_categories")
    .select("event_id, category_id, discount_value");

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-rose-300">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-rose-700">Events & Sales</h1>
        <p className="text-sm text-zinc-500">
          Create time-limited sales and discount events. Live events show sale prices on the store.
        </p>
      </div>
      <EventManager
        initialEvents={eventsResult.data ?? []}
        categories={categoriesResult.data ?? []}
        products={productsResult.data ?? []}
        initialEventProducts={eventProducts ?? []}
        initialEventCategories={eventCategories ?? []}
      />
    </section>
  );
}
