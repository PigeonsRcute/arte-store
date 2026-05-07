import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function GalleryIndexPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("slug, sort_order")
    .order("sort_order", { ascending: true })
    .limit(1);

  const firstSlug = categories?.[0]?.slug;
  if (firstSlug) {
    redirect(`/gallery/${firstSlug}`);
  }

  return (
    <section className="py-20 text-center">
      <p className="text-lg font-bold text-zinc-500">No categories yet.</p>
      <p className="mt-1 text-sm text-zinc-400">Add some in the admin panel.</p>
    </section>
  );
}
