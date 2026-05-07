"use client";

import { useState } from "react";

export type PickerItem = {
  id: string;
  name: string;
  imageSrc: string | null;
  priceCents: number;
};

type Props = {
  label: string;
  items: PickerItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  max: number;
};

export default function ProductPicker({ label, items, selectedIds, onChange, max }: Props) {
  const [search, setSearch] = useState("");

  const selectedItems = selectedIds
    .map(id => items.find(item => item.id === id))
    .filter((x): x is PickerItem => x !== undefined);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(s => s !== id));
    } else if (selectedIds.length < max) {
      onChange([...selectedIds, id]);
    }
  }

  const atMax = selectedIds.length >= max;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500">
          {label}
        </label>
        <span className={`text-xs font-semibold ${atMax ? "text-violet-600" : "text-zinc-400"}`}>
          {selectedIds.length}/{max} selected
        </span>
      </div>

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-1.5 pr-2"
            >
              {item.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageSrc} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="h-5 w-5 rounded-full bg-violet-200" />
              )}
              <span className="max-w-[140px] truncate text-xs font-semibold text-violet-700">
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="ml-0.5 text-sm leading-none text-violet-400 hover:text-violet-700"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search products…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      />

      {/* Picker grid */}
      {items.length === 0 ? (
        <p className="text-xs text-zinc-400">No published products found.</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-xs text-zinc-400">No products match your search.</p>
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50 p-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map(item => {
              const isSelected = selectedIds.includes(item.id);
              const isDisabled = atMax && !isSelected;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggle(item.id)}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition ${
                    isSelected
                      ? "border-violet-400 bg-violet-50 ring-2 ring-violet-300"
                      : isDisabled
                      ? "cursor-not-allowed border-zinc-200 bg-white opacity-40"
                      : "border-zinc-200 bg-white hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-full overflow-hidden rounded-md bg-zinc-100">
                    {item.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-zinc-200" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-violet-600/25">
                        <div className="rounded-full bg-white p-0.5 shadow">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7l3 3 5-5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="w-full truncate text-[11px] font-semibold text-zinc-700">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ${(item.priceCents / 100).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
