"use client";

import Link from "next/link";
import { AnimatedFeatureCard } from "@/components/ui/AnimatedFeatureCard";
import { SparklesText } from "@/components/ui/sparkles-text";
import type { FeaturedProductsContent } from "@/lib/types";
import { useHoverColor } from "@/lib/use-hover-color";

interface DisplayProduct {
  id: string;
  title: string;
  category: string | null;
  slug: string;
  image_url: string | null;
}

interface Props {
  content: FeaturedProductsContent;
  products: DisplayProduct[];
}

const COLORS = ["orange", "purple", "blue"] as const;

const PLACEHOLDERS: DisplayProduct[] = [
  { id: "ph1", title: "Original Print — Series I",    category: "Prints",      slug: "shop", image_url: null },
  { id: "ph2", title: "Digital Composition No. 7",    category: "Digital Art", slug: "shop", image_url: null },
  { id: "ph3", title: "Mixed Media Study",            category: "Mixed Media", slug: "shop", image_url: null },
];

export default function FeaturedProducts({ content, products }: Props) {
  const { headline } = content;
  const display = products.length > 0 ? products : PLACEHOLDERS;
  const { onClick: onHeadlineHover } = useHoverColor();

  return (
    <section className="bg-white py-20 px-4">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 flex items-end justify-between px-2">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-yellow-600">
              Latest Work
            </p>
            <h2
              className="text-4xl font-black tracking-tight text-zinc-900 md:text-5xl"
              onClick={onHeadlineHover}
            >
              <SparklesText
                text={headline || "New Releases"}
                className="text-4xl font-black tracking-tight md:text-5xl"
              />
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 px-6 py-2.5 text-sm font-black text-zinc-900 transition-all hover:bg-zinc-900 hover:text-white"
          >
            View all →
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {display.slice(0, 6).map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="w-full max-w-sm"
            >
              <AnimatedFeatureCard
                index={String(i + 1).padStart(3, "0")}
                tag={product.category || "Art"}
                title={product.title}
                imageSrc={product.image_url ?? "/placeholder-art.svg"}
                color={COLORS[i % 3]}
                className="w-full max-w-none"
              />
            </Link>
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-10 flex justify-center md:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-900 px-6 py-2.5 text-sm font-black text-zinc-900"
          >
            View all →
          </Link>
        </div>
      </div>
    </section>
  );
}
