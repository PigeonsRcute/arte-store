import Link from "next/link";
import NailCard from "@/components/nails/NailCard";
import type { NailFeaturedProductsContent, NailProduct } from "@/lib/types";

interface Props {
  content: NailFeaturedProductsContent;
  products: NailProduct[];
}

export default function NailsFeaturedProducts({ content, products }: Props) {
  const { headline } = content;

  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-bold tracking-widest text-fuchsia-400">READY TO WEAR</p>
            <h2 className="text-3xl font-black text-zinc-800">{headline || "Featured Sets"}</h2>
          </div>
          <Link
            href="/nails/shop"
            className="rounded-full border border-fuchsia-200 px-5 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
          >
            View all →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.slice(0, 6).map(p => (
              <NailCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/60 py-20 text-center ring-1 ring-pink-100">
            <span className="text-5xl">💅</span>
            <p className="font-semibold text-zinc-500">First sets dropping soon.</p>
            <Link
              href="/nails/custom"
              className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white"
            >
              Order custom now
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
