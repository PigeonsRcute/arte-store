"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GlowCard } from "@/components/ui/GlowCard";
import { Typewriter } from "@/components/ui/typewriter";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import type { HeroContent } from "@/lib/types";
import { useHoverColor } from "@/lib/use-hover-color";

interface Props {
  content: HeroContent;
}

const ease = [0.16, 1, 0.3, 1] as const;

const TAGLINE_PHRASES = [
  "Original artwork. Bold colour. Made to hang.",
  "Every piece tells a story.",
  "Art that hits like artillery.",
  "Limited editions. Unlimited soul.",
];

export default function Hero({ content }: Props) {
  const { headline, subheadline, cta_text, cta_link, bg_image_url } = content;
  const { onClick: onHeadlineHover } = useHoverColor();

  // Drive CTA visibility via state so useEffect re-fires after every remount
  // (React Strict Mode double-mounts cancel Framer Motion's initial→animate
  // transition, leaving the wrapper stuck at opacity:0).
  const [ctaVisible, setCtaVisible] = useState(false);
  useEffect(() => { setCtaVisible(true); }, []);

  // Build tagline array: CMS value first (if set), then defaults
  const taglines = subheadline
    ? [subheadline, ...TAGLINE_PHRASES.filter((t) => t !== subheadline)]
    : TAGLINE_PHRASES;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0d0d0d]">
      {/* Fine grid texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Ambient colour blobs */}
      <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full bg-yellow-500/8 blur-[160px] pointer-events-none z-0" />
      <div className="absolute -bottom-48 right-0 w-[600px] h-[600px] rounded-full bg-pink-600/8 blur-[160px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* ── Left: typography ── */}
        <div className="space-y-8">
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Art Studio
            </span>
          </motion.div>

          {/* Headline — Typewriter types the store name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
          >
            <h1
              className="font-black leading-none tracking-tighter text-white"
              style={{ fontSize: "clamp(3.5rem, 8vw, 9rem)" }}
              onClick={onHeadlineHover}
            >
              <Typewriter
                text={headline || "PIGEON'S ARTILLERY"}
                className="block"
                cursorClassName="text-yellow-400"
                speed={80}
                loop={false}
              />
            </h1>
          </motion.div>

          {/* Subheadline — GooeyTextMorphing cycles through taglines */}
          <motion.div
            className="max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.5 }}
          >
            <GooeyText
              texts={taglines}
              textClassName="text-lg leading-relaxed text-white/70"
              morphTime={1.2}
              cooldownTime={3}
            />
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: ctaVisible ? 1 : 0, y: ctaVisible ? 0 : 20 }}
            transition={{ duration: 0.7, ease, delay: 0.6 }}
          >
            <Link
              href={cta_link || "/gallery"}
              className="group inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-wide text-zinc-900 transition-all hover:bg-yellow-300 hover:scale-105 active:scale-95"
            >
              {cta_text || "Explore the Gallery"}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-bold text-white/60 transition-all hover:border-white/50 hover:text-white"
            >
              About the artist
            </Link>
          </motion.div>
        </div>

        {/* ── Right: GlowCard artwork frame ── */}
        <motion.div
          className="flex justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease, delay: 0.3 }}
        >
          <GlowCard
            glowColor="orange"
            customSize
            className="w-72 h-[26rem] md:w-80 md:h-[30rem] lg:w-[26rem] lg:h-[36rem]"
          >
            {bg_image_url ? (
              <img
                src={bg_image_url}
                alt="Featured artwork"
                className="absolute inset-0 w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20">
                <motion.div
                  className="text-7xl"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  🎨
                </motion.div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-center px-6">
                  Your artwork here
                </p>
              </div>
            )}
          </GlowCard>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="text-[9px] uppercase tracking-[0.35em]">Scroll</span>
        <motion.div
          className="h-8 w-px bg-white/20"
          animate={{ scaleY: [1, 0.2, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
