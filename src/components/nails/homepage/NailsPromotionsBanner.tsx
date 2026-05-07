"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { NailPromotionsContent, NailProduct } from "@/lib/types";

interface Props {
  content: NailPromotionsContent;
  products: NailProduct[];
}

interface CardData {
  id: string;
  title: string;
  imageSrc: string | null;
  slug: string;
  bgFrom: string;
  bgTo: string;
  cardBg: string;
}

const PALETTES = [
  { bgFrom: "from-violet-400", bgTo: "to-purple-500",  cardBg: "bg-violet-50"  },
  { bgFrom: "from-fuchsia-400",bgTo: "to-pink-500",    cardBg: "bg-fuchsia-50" },
  { bgFrom: "from-pink-400",   bgTo: "to-rose-500",    cardBg: "bg-pink-50"    },
  { bgFrom: "from-purple-400", bgTo: "to-indigo-500",  cardBg: "bg-purple-50"  },
];

const PLACEHOLDERS: CardData[] = [
  { id: "ph1", title: "Coffin Set",     imageSrc: null, slug: "/nails/shop", ...PALETTES[0] },
  { id: "ph2", title: "Almond Set",     imageSrc: null, slug: "/nails/shop", ...PALETTES[1] },
  { id: "ph3", title: "Square Set",     imageSrc: null, slug: "/nails/shop", ...PALETTES[2] },
  { id: "ph4", title: "Stiletto Set",   imageSrc: null, slug: "/nails/shop", ...PALETTES[3] },
];

function BounceCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 0.95, rotate: "-1deg" }}
      className={`group relative min-h-[300px] cursor-pointer overflow-hidden rounded-2xl p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function NailsPromotionsBanner({ content, products }: Props) {
  const { badge_label, blurb, discount_text } = content;

  const cards: CardData[] = products.length > 0
    ? products.slice(0, 4).map((p, i) => ({
        id: p.id,
        title: p.name,
        imageSrc: p.images?.[0] || null,
        slug: `/nails/shop/${p.slug}`,
        ...PALETTES[i % 4],
      }))
    : PLACEHOLDERS;

  const [c1, c2, c3, c4] = cards;

  return (
    <section className="bg-zinc-900 py-16 px-4">
      <div className="mx-auto max-w-7xl">

        {/* Section header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:px-2">
          <div className="space-y-3">
            <span className="inline-block rounded-full border border-violet-400/50 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-400">
              {badge_label || "SALE"}
            </span>
            <h2 className="max-w-lg text-4xl font-black text-white md:text-5xl">
              {blurb || "Limited-time deals on selected sets"}
            </h2>
          </div>
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="whitespace-nowrap rounded-full bg-violet-500 px-6 py-2.5 font-black text-sm text-white"
          >
            {discount_text || "Up to 25% off"}
          </motion.span>
        </div>

        {/* Row 1 */}
        <div className="mb-4 grid grid-cols-12 gap-4">
          {c1 && (
            <Link href={c1.slug} className="col-span-12 md:col-span-4">
              <BounceCard className={c1.cardBg}>
                <h3 className="text-center text-2xl font-black text-zinc-800">{c1.title}</h3>
                <div className="absolute top-3 right-3">
                  <span className="rounded-full border border-violet-400/50 bg-violet-400/10 px-2 py-0.5 text-[10px] font-black text-violet-600">
                    {badge_label || "SALE"}
                  </span>
                </div>
                <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c1.bgFrom} ${c1.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                  {c1.imageSrc
                    ? <img src={c1.imageSrc} alt={c1.title} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">💅</div>}
                </div>
              </BounceCard>
            </Link>
          )}
          {c2 && (
            <Link href={c2.slug} className="col-span-12 md:col-span-8">
              <BounceCard className={c2.cardBg}>
                <h3 className="text-center text-2xl font-black text-zinc-800">{c2.title}</h3>
                <div className="absolute top-3 right-3">
                  <span className="rounded-full border border-violet-400/50 bg-violet-400/10 px-2 py-0.5 text-[10px] font-black text-violet-600">
                    {badge_label || "SALE"}
                  </span>
                </div>
                <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c2.bgFrom} ${c2.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                  {c2.imageSrc
                    ? <img src={c2.imageSrc} alt={c2.title} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">💅</div>}
                </div>
              </BounceCard>
            </Link>
          )}
        </div>

        {/* Row 2 */}
        {(c3 || c4) && (
          <div className="grid grid-cols-12 gap-4">
            {c3 && (
              <Link href={c3.slug} className="col-span-12 md:col-span-8">
                <BounceCard className={c3.cardBg}>
                  <h3 className="text-center text-2xl font-black text-zinc-800">{c3.title}</h3>
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full border border-violet-400/50 bg-violet-400/10 px-2 py-0.5 text-[10px] font-black text-violet-600">
                      {badge_label || "SALE"}
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c3.bgFrom} ${c3.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                    {c3.imageSrc
                      ? <img src={c3.imageSrc} alt={c3.title} className="w-full h-full object-cover opacity-80" />
                      : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">💅</div>}
                  </div>
                </BounceCard>
              </Link>
            )}
            {c4 && (
              <Link href={c4.slug} className="col-span-12 md:col-span-4">
                <BounceCard className={c4.cardBg}>
                  <h3 className="text-center text-2xl font-black text-zinc-800">{c4.title}</h3>
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full border border-violet-400/50 bg-violet-400/10 px-2 py-0.5 text-[10px] font-black text-violet-600">
                      {badge_label || "SALE"}
                    </span>
                  </div>
                  <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c4.bgFrom} ${c4.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                    {c4.imageSrc
                      ? <img src={c4.imageSrc} alt={c4.title} className="w-full h-full object-cover opacity-80" />
                      : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">💅</div>}
                  </div>
                </BounceCard>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
