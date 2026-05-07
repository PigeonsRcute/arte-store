"use client";

import type { SaleEvent, EventStatus } from "@/lib/types";
import HeroBadge from "@/components/ui/HeroBadge";
import { SparklesText } from "@/components/ui/sparkles-text";

type BadgeVariant = "default" | "outline" | "ghost";

const STATUS_CONFIG: Record<EventStatus, { variant: BadgeVariant; label: string; className: string }> = {
  draft:     { variant: "ghost",   label: "Draft",     className: "text-zinc-500" },
  scheduled: { variant: "outline", label: "Scheduled", className: "border-blue-400 text-blue-600" },
  live:      { variant: "default", label: "🔴 Live",   className: "bg-green-100 text-green-700 border-green-300" },
  ended:     { variant: "outline", label: "Ended",     className: "border-zinc-300 text-zinc-400" },
};

type EventCardProps = {
  event: SaleEvent;
  onEdit: (event: SaleEvent) => void;
  onDelete: (event: SaleEvent) => void;
  onStatusChange: (event: SaleEvent, status: EventStatus) => void;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function EventCard({ event, onEdit, onDelete, onStatusChange }: EventCardProps) {
  const cfg = STATUS_CONFIG[event.status];

  const canLaunch = event.status === "draft" || event.status === "scheduled";
  const canEnd    = event.status === "live";

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-zinc-900 truncate text-base">{event.name}</h3>
          {event.description && (
            <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{event.description}</p>
          )}
        </div>
        <HeroBadge
          text={cfg.label}
          variant={cfg.variant}
          className={cfg.className}
        />
      </div>

      {/* Discount info */}
      <div className="flex items-center gap-3 text-sm text-zinc-700">
        <span className="rounded-md bg-zinc-100 px-2 py-1 font-semibold">
          {event.discount_type === "percent"
            ? `${event.discount_value}% off`
            : `$${Number(event.discount_value).toFixed(2)} off`}
        </span>
        <span className="text-zinc-400">
          {formatDate(event.starts_at)} → {formatDate(event.ends_at)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
        >
          Edit
        </button>

        {canLaunch && (
          <button
            type="button"
            onClick={() => onStatusChange(event, "live")}
            className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-600"
          >
            <SparklesText text="Launch" className="text-xs font-bold" />
          </button>
        )}

        {canEnd && (
          <button
            type="button"
            onClick={() => onStatusChange(event, "ended")}
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-800"
          >
            End Event
          </button>
        )}

        {event.status === "ended" && (
          <button
            type="button"
            onClick={() => onStatusChange(event, "live")}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            Re-launch
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(event)}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
