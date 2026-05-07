import { createClient } from "@/lib/supabase/server";
import CategoryManager from "@/components/admin/categories/CategoryManager";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-orange-300">
      <h1 className="text-2xl font-black tracking-tight text-orange-700">Categories</h1>
      <p className="text-sm text-zinc-500">
        Drag to reorder. Order here controls the order in the gallery navigation.
      </p>
      <CategoryManager initialCategories={categories ?? []} />
    </section>
  );
}
