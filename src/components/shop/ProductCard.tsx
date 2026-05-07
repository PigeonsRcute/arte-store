"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product, SalePrice } from "@/lib/types";
import AddToCartButton from "@/components/shop/AddToCartButton";

type ProductCardProps = {
  product: Product;
  isAdmin?: boolean;
  salePrice?: SalePrice;
};

export default function ProductCard({ product, isAdmin, salePrice }: ProductCardProps) {
  const heroImage = product.image_urls?.[0] || product.image_url;

  return (
    <article className="group relative flex flex-col bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1A1A1A]">
      {/* Admin overlay */}
      {isAdmin && (
        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <Link
            href={`/admin/products`}
            className="border-2 border-[#1A1A1A] bg-[#1A1A1A] px-2.5 py-1 font-mono text-xs font-bold text-white hover:bg-[#FF3B3B]"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
        </div>
      )}

      <Link href={`/products/${product.slug}`} className="contents">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[#F5F5F0] border-b-2 border-[#1A1A1A]">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={product.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-sm text-[#6B6B6B]">
              No image
            </div>
          )}
          {salePrice && (
            <span className="absolute left-0 top-3 border-2 border-[#1A1A1A] bg-[#FF3B3B] px-2 py-0.5 font-mono text-xs font-black text-white shadow-[2px_2px_0_#1A1A1A]">
              SALE
            </span>
          )}
          {!salePrice && product.category && (
            <span className="absolute left-0 top-3 border-2 border-[#1A1A1A] bg-[#FFD600] px-2 py-0.5 font-mono text-xs font-black text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]">
              {product.category}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-display font-black text-[#1A1A1A] leading-tight">{product.title}</h3>
          {product.description && (
            <p className="line-clamp-2 text-sm text-[#6B6B6B]">{product.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            {salePrice ? (
              <div className="flex flex-col">
                <span className="font-mono text-lg font-black text-[#FF3B3B]">
                  ${(salePrice.sale_cents / 100).toFixed(2)}
                </span>
                <span className="font-mono text-xs text-[#6B6B6B] line-through">
                  ${(salePrice.original_cents / 100).toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-mono text-lg font-black text-[#1A1A1A]">
                ${(product.price_cents / 100).toFixed(2)}
              </span>
            )}
            <span className="border-2 border-[#1A1A1A] bg-white px-4 py-1.5 font-mono text-xs font-black text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#1A1A1A]">
              View →
            </span>
          </div>
        </div>
      </Link>

      {/* Add to Cart — outside Link to avoid nested interactive elements */}
      {product.stock_quantity > 0 && (
        <div className="border-t-2 border-[#1A1A1A] px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <AddToCartButton
            productId={product.id}
            quantity={1}
            className="ds-btn-primary w-full text-sm"
          />
        </div>
      )}
      {product.stock_quantity === 0 && (
        <div className="border-t-2 border-[#1A1A1A] px-4 py-3">
          <span className="block w-full border-2 border-[#1A1A1A] bg-[#F5F5F0] py-2 text-center font-mono text-xs font-black uppercase tracking-widest text-[#1A1A1A]/40">
            Sold Out
          </span>
        </div>
      )}
    </article>
  );
}
