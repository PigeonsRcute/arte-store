import Link from "next/link";
import type { Category } from "@/lib/types";
import GradientMenu from "@/components/ui/GradientMenu";

type CategoryNavProps = {
  categories: Category[];
  activeSlug?: string;
};

export default function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  const items = categories.map((cat) => ({
    label: cat.name,
    href: `/gallery/${cat.slug}`,
    gradientFrom: cat.gradient_from,
    gradientTo: cat.gradient_to,
    active: cat.slug === activeSlug,
  }));

  return <GradientMenu items={items} />;
}
