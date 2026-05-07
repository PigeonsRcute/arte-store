"use client";

import Image from "next/image";
import type { Product, Category } from "@/lib/types";

type ProductGridProps = {
  products: Product[];
  categories: Category[];
  productCategoryMap: Record<string, string[]>; // product_id → category_id[]
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export default function ProductGrid({
  products,
  categories,
  productCategoryMap,
  onEdit,
  onDelete,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No products match your search.
      </p>
    );
  }

  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const heroImage = product.image_urls?.[0] || product.image_url;
        const lowStock = product.stock_quantity < 5;
        const catIds = productCategoryMap[product.id] ?? [];
        const cats = catIds.map((id) => categoryById[id]).filter(Boolean);

        return (
          <article
            key={product.id}
            className="group space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={product.title}
                  fill
                  className="object-cover transition group-hover:scale-[1.02]"
                  sizes="300px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  No image
                </div>
              )}
              {!product.is_published && (
                <span className="absolute left-2 top-2 rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold text-white">
                  DRAFT
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900 leading-snug">{product.title}</h3>
              <p className="text-xs text-zinc-400">{product.sku ?? "No SKU"}</p>
              <p className="text-sm font-semibold text-zinc-900">
                ${(product.price_cents / 100).toFixed(2)}
              </p>
              <p className={`text-xs ${lowStock ? "font-bold text-red-600" : "text-zinc-400"}`}>
                Stock: {product.stock_quantity}
                {lowStock ? " — Low stock" : ""}
              </p>
            </div>

            {/* Category badges */}
            {cats.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cats.map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{
                      background: `linear-gradient(to right, ${cat.gradient_from}, ${cat.gradient_to})`,
                    }}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="flex-1 rounded-lg bg-blue-500 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="flex-1 rounded-lg bg-red-500 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
