"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DeliveryStep = {
  status: string;
  label: string;
  timestamp: string;
  note?: string;
};

const PRESET_SLUGS = [
  { value: "order_placed", label: "Order Placed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "__custom__", label: "Custom…" },
] as const;

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

function sortByTimestamp(steps: DeliveryStep[]): DeliveryStep[] {
  return [...steps].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

type Props = { orderId: string; initialSteps: DeliveryStep[] };

export default function DeliveryTimelineEditor({ orderId, initialSteps }: Props) {
  const [steps, setSteps] = useState<DeliveryStep[]>(sortByTimestamp(initialSteps));
  const [label, setLabel] = useState("");
  const [slugPreset, setSlugPreset] = useState<string>("processing");
  const [customSlug, setCustomSlug] = useState("");
  const [datetime, setDatetime] = useState(() => toDatetimeLocal(new Date()));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCustom = slugPreset === "__custom__";
  const effectiveSlug = isCustom ? customSlug.trim() : slugPreset;

  async function addStep() {
    if (!label.trim() || !effectiveSlug) return;
    setSaving(true);
    setError(null);

    const newStep: DeliveryStep = {
      status: effectiveSlug,
      label: label.trim(),
      timestamp: new Date(datetime).toISOString(),
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    const newSteps = sortByTimestamp([...steps, newStep]);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("orders")
      .update({ delivery_steps: newSteps })
      .eq("id", orderId);

    if (err) {
      setError(err.message);
    } else {
      setSteps(newSteps);
      setLabel("");
      setNote("");
      setDatetime(toDatetimeLocal(new Date()));
      if (isCustom) setCustomSlug("");
    }
    setSaving(false);
  }

  async function deleteStep(index: number) {
    setDeletingIndex(index);
    const newSteps = steps.filter((_, i) => i !== index);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("orders")
      .update({ delivery_steps: newSteps })
      .eq("id", orderId);

    if (!err) setSteps(newSteps);
    setDeletingIndex(null);
  }

  const canAdd = label.trim().length > 0 && effectiveSlug.length > 0 && !saving;

  return (
    <section className="ds-card space-y-5">
      <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">
        Delivery Timeline
      </h2>

      {/* ── Existing steps ─────────────────────────────────────────────────── */}
      {steps.length === 0 ? (
        <p className="text-sm italic text-zinc-400">No delivery steps yet.</p>
      ) : (
        <ol className="space-y-2">
          {steps.map((step, i) => {
            const isLatest = i === steps.length - 1;
            return (
              <li
                key={i}
                className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 ${
                  isLatest
                    ? "bg-green-50 ring-1 ring-green-200"
                    : "bg-zinc-50 opacity-70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isLatest ? "text-green-800" : "text-zinc-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-400">
                    {step.status}
                    {" · "}
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                  {step.note && (
                    <p className="mt-1 text-xs italic text-zinc-500">{step.note}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteStep(i)}
                  disabled={deletingIndex === i}
                  className="ds-btn-ghost shrink-0 px-2 py-1 text-xs text-zinc-400 hover:text-red-600 disabled:opacity-40"
                >
                  {deletingIndex === i ? "…" : "Delete"}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {/* ── Add step form ──────────────────────────────────────────────────── */}
      <div className="space-y-3 border-t border-zinc-100 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Add Step
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="ds-input"
            placeholder='Label — e.g. "Package picked up"'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          <select
            className="ds-input"
            value={slugPreset}
            onChange={(e) => setSlugPreset(e.target.value)}
          >
            {PRESET_SLUGS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {isCustom && (
            <input
              className="ds-input sm:col-span-2"
              placeholder="Custom status slug (e.g. at_customs)"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
            />
          )}

          <input
            type="datetime-local"
            className="ds-input"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />

          <textarea
            className="ds-input resize-none"
            placeholder="Optional note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button
          onClick={addStep}
          disabled={!canAdd}
          className="ds-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Adding…" : "Add Step"}
        </button>
      </div>
    </section>
  );
}
