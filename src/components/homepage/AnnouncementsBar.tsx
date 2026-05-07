"use client";

import Link from "next/link";
import type { AnnouncementsContent } from "@/lib/types";

interface Props {
  content: AnnouncementsContent;
  variant?: "nails";
}

export default function AnnouncementsBar({ content, variant }: Props) {
  const { text, link, link_label } = content;
  const displayText = link_label ? `${text}  —  ${link_label} →` : text;

  const isNails = variant === "nails";
  const barClass = isNails
    ? "w-full border-b-2 border-violet-800 bg-[#7C3AED] px-4 py-2 flex items-center justify-center"
    : "w-full border-b-2 border-[#1A1A1A] bg-[#FFD600] px-4 py-2 flex items-center justify-center";
  const textClass = isNails
    ? "font-mono text-xs font-bold uppercase tracking-widest text-white hover:underline"
    : "font-mono text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:underline";
  const spanClass = isNails
    ? "font-mono text-xs font-bold uppercase tracking-widest text-white"
    : "font-mono text-xs font-bold uppercase tracking-widest text-[#1A1A1A]";

  return (
    <div className={barClass}>
      {link ? (
        <Link href={link} className={textClass}>
          📢 {displayText}
        </Link>
      ) : (
        <span className={spanClass}>
          📢 {displayText}
        </span>
      )}
    </div>
  );
}
