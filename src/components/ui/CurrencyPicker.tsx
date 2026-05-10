"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import {
  SUPPORTED_CURRENCIES,
  POPULAR_CURRENCY_CODES,
  type Currency,
} from "@/lib/currency";

const popularSet = new Set(POPULAR_CURRENCY_CODES);
const popular = SUPPORTED_CURRENCIES.filter((c) => popularSet.has(c.code));
const rest = SUPPORTED_CURRENCIES.filter((c) => !popularSet.has(c.code));

export default function CurrencyPicker() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.toLowerCase();
  const filterList = (list: Currency[]) =>
    q
      ? list.filter(
          (c) =>
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q),
        )
      : list;

  const filteredPopular = filterList(popular);
  const filteredRest = filterList(rest);

  const handleSelect = useCallback(
    (c: Currency) => {
      setCurrency(c);
      setOpen(false);
      setQuery("");
    },
    [setCurrency],
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border-2 border-[#1A1A1A] bg-white px-2.5 py-1 font-mono text-xs font-black text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#1A1A1A]"
        aria-label="Select currency"
      >
        <span>{currency.flag}</span>
        <span>{currency.code}</span>
        <svg
          viewBox="0 0 10 6"
          className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0_#1A1A1A]">
          {/* Search */}
          <div className="border-b-2 border-[#1A1A1A] p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search currency…"
              className="w-full border-2 border-[#1A1A1A] bg-[#F5F5F0] px-2.5 py-1.5 font-mono text-xs text-[#1A1A1A] placeholder-[#1A1A1A]/40 outline-none focus:border-[#0047FF]"
            />
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {filteredPopular.length > 0 && (
              <>
                <div className="px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                  Popular
                </div>
                {filteredPopular.map((c) => (
                  <CurrencyOption
                    key={c.code}
                    c={c}
                    selected={c.code === currency.code}
                    onSelect={handleSelect}
                  />
                ))}
              </>
            )}

            {filteredRest.length > 0 && (
              <>
                {filteredPopular.length > 0 && (
                  <div className="border-t-2 border-[#1A1A1A]/10" />
                )}
                <div className="px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                  All currencies
                </div>
                {filteredRest.map((c) => (
                  <CurrencyOption
                    key={c.code}
                    c={c}
                    selected={c.code === currency.code}
                    onSelect={handleSelect}
                  />
                ))}
              </>
            )}

            {filteredPopular.length === 0 && filteredRest.length === 0 && (
              <p className="px-3 py-4 text-center font-mono text-xs text-[#1A1A1A]/40">
                No currencies match &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CurrencyOption({
  c,
  selected,
  onSelect,
}: {
  c: Currency;
  selected: boolean;
  onSelect: (c: Currency) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#F5F5F0] ${
        selected ? "bg-[#FFD600]/30 font-black" : ""
      }`}
    >
      <span className="text-base leading-none">{c.flag}</span>
      <span className="font-mono text-xs font-bold text-[#1A1A1A]">{c.code}</span>
      <span className="truncate font-mono text-xs text-[#1A1A1A]/60">{c.name}</span>
      {selected && (
        <span className="ml-auto font-mono text-xs text-[#0047FF]">✓</span>
      )}
    </button>
  );
}
