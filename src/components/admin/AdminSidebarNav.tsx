"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavEntry } from "@/components/admin/AdminSidebar";

interface Props {
  entries: NavEntry[];
}

export default function AdminSidebarNav({ entries }: Props) {
  const pathname = usePathname();

  return (
    <aside className="h-fit border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0_#1A1A1A] p-4">
      <p className="mb-3 font-mono text-xs font-black uppercase tracking-widest text-[#FF3B3B]">
        Admin
      </p>
      <nav className="space-y-0.5 text-sm">
        {entries.map((entry, i) => {
          if (entry.type === "group") {
            return (
              <div
                key={`group-${i}`}
                className="mt-4 mb-1 px-3 font-mono text-[10px] font-black tracking-widest text-[#6B6B6B] uppercase"
              >
                {entry.label}
              </div>
            );
          }

          const { href, label, activeColor } = entry;
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 font-bold transition-colors ${
                isActive
                  ? activeColor
                  : "text-[#1A1A1A] hover:bg-[#F5F5F0]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
