"use client";

import Link from "next/link";

export type GradientMenuItem = {
  label: string;
  href: string;
  gradientFrom: string;
  gradientTo: string;
  active?: boolean;
};

type GradientMenuProps = {
  items: GradientMenuItem[];
  className?: string;
};

export default function GradientMenu({ items, className = "" }: GradientMenuProps) {
  return (
    <nav className={`flex flex-wrap gap-3 ${className}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
          style={{
            background: item.active
              ? `linear-gradient(135deg, ${item.gradientFrom}, ${item.gradientTo})`
              : "white",
            color: item.active ? "white" : "#52525b",
            boxShadow: item.active
              ? `0 4px 20px ${item.gradientFrom}55`
              : "0 1px 4px rgba(0,0,0,0.08)",
            border: item.active ? "none" : "1px solid #e4e4e7",
          }}
        >
          {/* Gradient reveal on hover (inactive items) */}
          {!item.active && (
            <span
              className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${item.gradientFrom}, ${item.gradientTo})`,
              }}
            />
          )}
          <span className={`relative z-10 transition-colors duration-300 ${!item.active ? "group-hover:text-white" : ""}`}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
