"use client";

import { motion } from "framer-motion";
import { GlowCard } from "@/components/ui/GlowCard";
import type { ComingSoonContent } from "@/lib/types";
import { useHoverColor } from "@/lib/use-hover-color";

interface Props {
  content: ComingSoonContent;
  variant?: "nails";
}

export default function ComingSoon({ content, variant }: Props) {
  const { title, expected_date, teaser_image_url } = content;
  const { onClick: onHeadlineHover } = useHoverColor();
  const isNails = variant === "nails";

  return (
    <section className="bg-zinc-900 py-20 px-4">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 px-2">
          <p className={`mb-2 text-xs font-black uppercase tracking-[0.3em] ${isNails ? "text-violet-400" : "text-blue-400"}`}>
            In production
          </p>
          <h2
            className="text-4xl font-black tracking-tight text-white md:text-5xl"
            onClick={onHeadlineHover}
          >
            Coming Soon
          </h2>
        </div>

        {/* GlowCard shell — floating image inside (AnimatedFeatureCard technique) */}
        <div className="flex justify-center">
          <GlowCard
            glowColor="purple"
            customSize
            className="w-full max-w-2xl h-[420px]"
          >
            {/* Floating image — absolutely positioned inside the card (position:relative on GlowCard) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              whileHover={{ y: -20, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              {teaser_image_url ? (
                <img
                  src={teaser_image_url}
                  alt={title}
                  className="w-52 h-52 object-contain drop-shadow-2xl"
                />
              ) : (
                <motion.div
                  className="text-8xl select-none"
                  animate={{ rotate: [0, 4, -4, 0], y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {isNails ? "💅" : "🎨"}
                </motion.div>
              )}
            </motion.div>

            {/* Text block — sits in grid row 2 (auto height, bottom of card) */}
            <div className="relative z-20 text-center space-y-2">
              <h3 className="text-xl font-black text-white">{title}</h3>
              {expected_date && (
                <p className="text-xs text-white/50 uppercase tracking-[0.25em]">
                  Expected: {expected_date}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 text-white/35 text-[10px] uppercase tracking-[0.3em] pt-1">
                <motion.span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${isNails ? "bg-violet-400" : "bg-blue-400"}`}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0.3, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                In progress
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </section>
  );
}
