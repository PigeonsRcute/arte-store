"use client";

import type { Category } from "@/lib/types";
import GradientMenu from "@/components/ui/GradientMenu";
import { useHoverColor } from "@/lib/use-hover-color";

type CategoryPreviewProps = {
  categories: Category[];
};

export default function CategoryPreview({ categories }: CategoryPreviewProps) {
  const { onClick: onHeadlineHover } = useHoverColor();
  const items = categories.map((cat) => ({
    label: cat.name,
    href: `/gallery/${cat.slug}`,
    gradientFrom: cat.gradient_from,
    gradientTo: cat.gradient_to,
  }));

  return (
    <section className="bg-zinc-950 py-16 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
            Browse by Type
          </p>
          <h2
            className="text-3xl font-black tracking-tight text-white md:text-4xl"
            onClick={onHeadlineHover}
          >
            Shop by Category
          </h2>
        </div>
        <GradientMenu items={items} />
      </div>
    </section>
  );
}
