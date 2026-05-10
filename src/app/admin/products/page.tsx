import { createClient } from "@/lib/supabase/server";
import ProductManager from "@/components/admin/products/ProductManager";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,slug,title,description,price_cents,shipping_cost_cents,stock_quantity,image_url,image_urls,sku,category,dimensions,edition_size,weight_grams,is_published,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  // Fetch all product→category links so we can pre-populate multi-select
  const { data: productCategories } = await supabase
    .from("product_categories")
    .select("product_id, category_id");

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-pink-300">
      <h1 className="text-2xl font-black tracking-tight text-pink-700">Products</h1>
      <ProductManager
        initialProducts={productsResult.data ?? []}
        categories={categoriesResult.data ?? []}
        initialProductCategories={productCategories ?? []}
      />
    </section>
  );
}
