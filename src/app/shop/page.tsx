import type { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth";
import { buildSalePriceMap } from "@/lib/sale-price";
import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";

async function getShopData() {
  try {
    const supabase = await createClient();

    const [productsResult, authResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);

    const products: Product[] = productsResult.data ?? [];
    const user = authResult.data?.user ?? null;
    const isAdmin = await getIsAdmin(supabase, user?.id);
    const salePriceMap = await buildSalePriceMap(supabase, products);

    return { products, isAdmin, salePriceMap };
  } catch {
    return { products: [], isAdmin: false, salePriceMap: {} };
  }
}

export default async function ShopPage() {
  const { products, isAdmin, salePriceMap } = await getShopData();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-red-600">Gallery</h1>
          <p className="text-blue-700">Browse all published artworks.</p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/products"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-700"
          >
            + Add Product
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-white/90 p-10 text-center shadow-lg ring-2 ring-yellow-300">
          <p className="text-lg font-bold text-zinc-500">No artworks published yet.</p>
          <p className="mt-1 text-sm text-zinc-400">Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={isAdmin}
              salePrice={salePriceMap[product.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
