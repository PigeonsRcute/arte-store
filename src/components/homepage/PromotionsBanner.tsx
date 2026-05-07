"use client";

import { motion } from "framer-motion";
import HeroBadge from "@/components/ui/HeroBadge";
import type { PromotionsContent, Product } from "@/lib/types";

interface Props {
  content: PromotionsContent;
  products: Product[];
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
  { bgFrom: "from-violet-400", bgTo: "to-indigo-500", cardBg: "bg-violet-50" },
  { bgFrom: "from-amber-400",  bgTo: "to-orange-500", cardBg: "bg-amber-50"  },
  { bgFrom: "from-emerald-400",bgTo: "to-teal-500",   cardBg: "bg-emerald-50"},
  { bgFrom: "from-pink-400",   bgTo: "to-rose-500",   cardBg: "bg-rose-50"   },
];

const PLACEHOLDERS: CardData[] = [
  { id: "ph1", title: "Original Print", imageSrc: null, slug: "/shop", ...PALETTES[0] },
  { id: "ph2", title: "Digital Art",    imageSrc: null, slug: "/shop", ...PALETTES[1] },
  { id: "ph3", title: "Mixed Media",    imageSrc: null, slug: "/shop", ...PALETTES[2] },
  { id: "ph4", title: "Limited Edition",imageSrc: null, slug: "/shop", ...PALETTES[3] },
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

export default function PromotionsBanner({ content, products }: Props) {
  const { badge_label, blurb, discount_text } = content;

  const cards: CardData[] = products.length > 0
    ? products.slice(0, 4).map((p, i) => ({
        id: p.id,
        title: p.title,
        imageSrc: p.image_url || p.image_urls?.[0] || null,
        slug: `/products/${p.slug}`,
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
            <HeroBadge
              text={badge_label || "SALE"}
              variant="outline"
              size="sm"
              className="border-red-400/50 bg-red-400/10 text-red-400 font-black"
            />
            <h2 className="max-w-lg text-4xl font-black text-white md:text-5xl">
              {blurb || "Limited-time deals on selected originals"}
            </h2>
          </div>
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="whitespace-nowrap rounded-full bg-yellow-400 px-6 py-2.5 font-black text-sm text-zinc-900"
          >
            {discount_text || "Up to 30% off"}
          </motion.span>
        </div>

        {/* Row 1 */}
        <div className="mb-4 grid grid-cols-12 gap-4">
          {c1 && (
            <BounceCard className={`col-span-12 md:col-span-4 ${c1.cardBg}`}>
              <h3 className="text-center text-2xl font-black text-zinc-800">{c1.title}</h3>
              <div className="absolute top-3 right-3">
                <HeroBadge text={badge_label || "SALE"} variant="outline" size="sm"
                  className="border-red-400/50 bg-red-400/10 text-red-600 font-black text-[10px]" />
              </div>
              <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c1.bgFrom} ${c1.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                {c1.imageSrc
                  ? <img src={c1.imageSrc} alt={c1.title} className="w-full h-full object-cover opacity-80" />
                  : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">🎨</div>}
              </div>
            </BounceCard>
          )}
          {c2 && (
            <BounceCard className={`col-span-12 md:col-span-8 ${c2.cardBg}`}>
              <h3 className="text-center text-2xl font-black text-zinc-800">{c2.title}</h3>
              <div className="absolute top-3 right-3">
                <HeroBadge text={badge_label || "SALE"} variant="outline" size="sm"
                  className="border-red-400/50 bg-red-400/10 text-red-600 font-black text-[10px]" />
              </div>
              <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c2.bgFrom} ${c2.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                {c2.imageSrc
                  ? <img src={c2.imageSrc} alt={c2.title} className="w-full h-full object-cover opacity-80" />
                  : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">🎨</div>}
              </div>
            </BounceCard>
          )}
        </div>

        {/* Row 2 */}
        {(c3 || c4) && (
          <div className="grid grid-cols-12 gap-4">
            {c3 && (
              <BounceCard className={`col-span-12 md:col-span-8 ${c3.cardBg}`}>
                <h3 className="text-center text-2xl font-black text-zinc-800">{c3.title}</h3>
                <div className="absolute top-3 right-3">
                  <HeroBadge text={badge_label || "SALE"} variant="outline" size="sm"
                    className="border-red-400/50 bg-red-400/10 text-red-600 font-black text-[10px]" />
                </div>
                <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c3.bgFrom} ${c3.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                  {c3.imageSrc
                    ? <img src={c3.imageSrc} alt={c3.title} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">🎨</div>}
                </div>
              </BounceCard>
            )}
            {c4 && (
              <BounceCard className={`col-span-12 md:col-span-4 ${c4.cardBg}`}>
                <h3 className="text-center text-2xl font-black text-zinc-800">{c4.title}</h3>
                <div className="absolute top-3 right-3">
                  <HeroBadge text={badge_label || "SALE"} variant="outline" size="sm"
                    className="border-red-400/50 bg-red-400/10 text-red-600 font-black text-[10px]" />
                </div>
                <div className={`absolute bottom-0 left-4 right-4 top-28 translate-y-8 rounded-t-2xl bg-gradient-to-br ${c4.bgFrom} ${c4.bgTo} overflow-hidden transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]`}>
                  {c4.imageSrc
                    ? <img src={c4.imageSrc} alt={c4.title} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl">🎨</div>}
                </div>
              </BounceCard>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
