"use client";

import { useState } from "react";
import type { SaleEvent } from "@/lib/types";

interface Props {
  events: SaleEvent[];
  data: Record<string, unknown>;
  isActive: boolean;
  onSave: (d: Record<string, unknown>, a: boolean) => void;
}

const STATUS_STYLES: Record<string, string> = {
  live:      "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
};

function formatDate(iso: string | null): string {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function HomepageEventPicker({ events, data, isActive, onSave }: Props) {
  const [active, setActive]     = useState(isActive);
  const [headline, setHeadline] = useState(String(data.headline ?? "Upcoming Events"));
  const [selectedIds, setSelected] = useState<string[]>(() =>
    Array.isArray(data.selected_event_ids) ? (data.selected_event_ids as string[]) : []
  );

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ headline, selected_event_ids: selectedIds }, active);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section visible toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-violet-500" : "bg-zinc-200"}`}
          onClick={() => setActive(v => !v)}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : ""}`} />
        </div>
        <span className="text-sm font-semibold text-zinc-700">Section visible</span>
      </label>

      {/* Headline */}
      <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500">Section headline</label>
        <input
          type="text"
          value={headline}
          onChange={e => setHeadline(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      {/* Event list */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500">
          Feature on homepage
          {selectedIds.length > 0 && (
            <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">
              {selectedIds.length} selected
            </span>
          )}
        </label>

        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400">
            No live or scheduled events.{" "}
            <a href="/admin/events" className="font-semibold text-violet-600 hover:underline">
              Create one in Events &amp; Sales
            </a>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {events.map(event => {
              const on = selectedIds.includes(event.id);
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 rounded-xl border p-3 transition-colors ${
                    on ? "border-violet-300 bg-violet-50" : "border-zinc-200 bg-white"
                  }`}
                >
                  {/* Banner thumbnail */}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {event.banner_url ? (
                      <img
                        src={event.banner_url}
                        alt={event.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-300">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Event info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-zinc-800">{event.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[event.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                        {event.status}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Starts {formatDate(event.starts_at)}
                      </span>
                    </div>
                  </div>

                  {/* On/off toggle */}
                  <div
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggle(event.id)}
                    className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${on ? "bg-violet-500" : "bg-zinc-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-violet-500 active:scale-95"
      >
        Save changes
      </button>
    </form>
  );
}
