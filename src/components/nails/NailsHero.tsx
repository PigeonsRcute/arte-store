"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SparklesText } from "@/components/ui/sparkles-text";
import type { NailHeroContent } from "@/lib/types";

interface Props {
  content?: NailHeroContent;
}

const DEFAULTS: NailHeroContent = {
  headline: "Your nails, your art.",
  subheadline: "Ready-made sets and fully custom designs. Choose your shape, length, finish, and extras — made by hand, just for you.",
  cta_text: "Shop Sets",
  cta_link: "/nails/shop",
};

export default function NailsHero({ content }: Props) {
  const { headline, subheadline, cta_text, cta_link } = { ...DEFAULTS, ...content };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-200 via-fuchsia-100 to-violet-200 px-8 py-24 text-center">
      {/* Animated iridescent overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,182,193,0.5), rgba(230,207,255,0.5), rgba(248,244,255,0.7), rgba(192,240,255,0.4), rgba(255,182,193,0.5))",
        }}
      />

      {/* Pearl shimmer streaks */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)",
          width: "60%",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <span className="rounded-full bg-white/60 px-4 py-1.5 text-xs font-bold tracking-widest text-fuchsia-600 backdrop-blur-sm ring-1 ring-fuchsia-200">
          HANDCRAFTED PRESS-ON NAILS
        </span>

        <SparklesText
          text={headline}
          className="text-5xl font-black text-zinc-800"
          colors={{ first: "#c084fc", second: "#f472b6" }}
          sparklesCount={14}
        />

        <p className="max-w-md text-lg text-zinc-600">{subheadline}</p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href={cta_link}
            className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-8 py-3 font-bold text-white shadow-lg shadow-pink-200 transition hover:scale-105 hover:shadow-xl hover:shadow-pink-300"
          >
            {cta_text}
          </Link>
          <Link
            href="/nails/custom"
            className="rounded-full border-2 border-fuchsia-300 bg-white/70 px-8 py-3 font-bold text-fuchsia-700 backdrop-blur-sm transition hover:scale-105 hover:bg-white"
          >
            Design Custom
          </Link>
        </div>
      </div>
    </section>
  );
}
