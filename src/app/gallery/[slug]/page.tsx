import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildSalePriceMap } from "@/lib/sale-price";
import type { Product, Category } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";
import CategoryNav from "@/components/gallery/CategoryNav";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const NEW_RELEASES_SLUG = "new-releases";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .single();
  return {
    title: category ? `${category.name} — Gallery` : "Gallery",
    description: category?.description ?? undefined,
  };
}

export default async function GalleryCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch all categories for nav
  const { data: allCategories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const categories: Category[] = allCategories ?? [];

  // Find this category
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  // Fetch products — "new-releases" uses all products sorted by created_at
  let products: Product[] = [];

  if (slug === NEW_RELEASES_SLUG) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    products = data ?? [];
  } else {
    // Products linked to this category via product_categories
    const { data: pcLinks } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", category.id);

    const productIds = pcLinks?.map((pc) => pc.product_id) ?? [];

    if (productIds.length > 0) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_published", true)
        .in("id", productIds)
        .order("created_at", { ascending: false });
      products = data ?? [];
    }
  }

  const salePriceMap = await buildSalePriceMap(supabase, products);

  return (
    <div className="space-y-8">
      {/* Category nav */}
      <CategoryNav categories={categories} activeSlug={slug} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-zinc-500">{category.description}</p>
        )}
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="rounded-2xl bg-white/90 p-12 text-center shadow ring-2 ring-zinc-200">
          <p className="text-lg font-bold text-zinc-400">No products in this category yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              salePrice={salePriceMap[product.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
