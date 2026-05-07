"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type FloatingActionItem = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

type FloatingActionMenuProps = {
  items: FloatingActionItem[];
};

export default function FloatingActionMenu({ items }: FloatingActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <>
            {[...items].reverse().map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.85 }}
                transition={{ duration: 0.18, delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="rounded-lg bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow backdrop-blur-sm">
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-700 shadow-lg ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:ring-zinc-300"
                  aria-label={item.label}
                >
                  {item.icon}
                </button>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl transition hover:bg-zinc-700"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </motion.button>
    </div>
  );
}
