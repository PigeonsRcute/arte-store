"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Palette = "yellow" | "cyan" | "purple";

// Palette → bold geometric shape layers painted on zinc-950
const SHAPES: Record<Palette, React.ReactNode> = {
  yellow: (
    <>
      {/* Large tilted slab — top-left anchor */}
      <div className="absolute -top-12 -left-20 h-[260px] w-[480px] -rotate-12 bg-yellow-400 opacity-95" />
      {/* Circle — center-right */}
      <div className="absolute top-[20%] -right-20 h-[360px] w-[360px] rounded-full bg-pink-500 opacity-90" />
      {/* Tall rectangle — bottom-left */}
      <div className="absolute -bottom-20 left-[5%] h-[500px] w-[240px] rotate-[14deg] bg-orange-500 opacity-85" />
      {/* Diamond accent — mid-center */}
      <div className="absolute top-[50%] left-[46%] h-[140px] w-[140px] rotate-45 bg-yellow-300 opacity-90" />
      {/* Slim bar — top, offset right */}
      <div className="absolute -top-4 right-[22%] h-[320px] w-[80px] -rotate-[22deg] bg-rose-400 opacity-80" />
    </>
  ),
  cyan: (
    <>
      {/* Large circle — top-right */}
      <div className="absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full bg-cyan-400 opacity-90" />
      {/* Wide slab — bottom-left */}
      <div className="absolute -bottom-16 -left-16 h-[240px] w-[460px] rotate-[8deg] bg-violet-600 opacity-85" />
      {/* Rotated square — mid-left */}
      <div className="absolute top-[35%] -left-10 h-[180px] w-[180px] rotate-[30deg] bg-emerald-400 opacity-85" />
      {/* Small circle — bottom-right */}
      <div className="absolute bottom-[20%] right-[8%] h-[120px] w-[120px] rounded-full bg-sky-300 opacity-90" />
      {/* Slim bar — top-center */}
      <div className="absolute -top-8 left-[42%] h-[360px] w-[70px] -rotate-[18deg] bg-violet-400 opacity-80" />
    </>
  ),
  purple: (
    <>
      {/* Tall rectangle — top, slightly rotated */}
      <div className="absolute -top-14 left-[25%] h-[520px] w-[280px] -rotate-[10deg] bg-indigo-600 opacity-90" />
      {/* Circle — mid-right */}
      <div className="absolute top-[22%] -right-16 h-[320px] w-[320px] rounded-full bg-violet-500 opacity-85" />
      {/* Wide slab — bottom-left */}
      <div className="absolute -bottom-12 -left-12 h-[200px] w-[440px] rotate-[11deg] bg-teal-400 opacity-88" />
      {/* Diamond — lower-left */}
      <div className="absolute top-[65%] left-[12%] h-[130px] w-[130px] rotate-45 bg-indigo-300 opacity-90" />
      {/* Slim bar — upper-right */}
      <div className="absolute -top-8 right-[18%] h-[280px] w-[90px] rotate-[22deg] bg-purple-400 opacity-80" />
    </>
  ),
};

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  palette?: Palette;
}

export default function AuthSplitLayout({ children, palette = "yellow" }: AuthSplitLayoutProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* ── LEFT PANEL ──────────────────────────────────────── */}
      <motion.div
        className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:w-[55%] lg:flex-col lg:justify-between lg:p-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        {/* Geometric background shapes */}
        {SHAPES[palette]}

        {/*
         * ============================================
         * TODO: REPLACE WITH CUSTOM 2D ILLUSTRATION
         * Drop your artwork here as:
         * <Image src="/art/auth-illustration.png" ... />
         * or a <video> WebM with transparent background
         * ============================================
         */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          {/* Custom illustration goes here */}
        </div>

        {/* Brand wordmark — top-left, above shapes */}
        <Link
          href="/"
          className="relative z-20 text-2xl font-black tracking-tight text-white transition-opacity hover:opacity-75"
        >
          Pigeon's Artillery
        </Link>

        {/* Tagline — bottom-left */}
        <p className="relative z-20 text-sm font-medium text-white/50">
          Original art, made with intention.
        </p>
      </motion.div>

      {/* ── RIGHT PANEL (form) ──────────────────────────────── */}
      <motion.div
        className="flex flex-1 items-center justify-center overflow-y-auto bg-white px-8 py-16"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-full max-w-md">{children}</div>
      </motion.div>
    </div>
  );
}
