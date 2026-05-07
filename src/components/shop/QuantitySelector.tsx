"use client";

import { useState } from "react";

type QuantitySelectorProps = {
  max: number;
  value?: number;
  onChange?: (qty: number) => void;
};

export default function QuantitySelector({ max, value, onChange }: QuantitySelectorProps) {
  const [internal, setInternal] = useState(1);
  const controlled = value !== undefined && onChange !== undefined;
  const quantity = controlled ? value : internal;

  const set = (next: number) => {
    const clamped = Math.max(1, Math.min(max, next));
    if (controlled) onChange(clamped);
    else setInternal(clamped);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-zinc-600 uppercase tracking-wide">Qty</span>
      <div className="flex items-center overflow-hidden rounded-xl border-2 border-zinc-200">
        <button
          type="button"
          onClick={() => set(quantity - 1)}
          disabled={quantity <= 1}
          className="flex h-10 w-10 items-center justify-center text-lg font-black text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-[2.5rem] select-none text-center text-base font-black text-zinc-900">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => set(quantity + 1)}
          disabled={quantity >= max}
          className="flex h-10 w-10 items-center justify-center text-lg font-black text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}
