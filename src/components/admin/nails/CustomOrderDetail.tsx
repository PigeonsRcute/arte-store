"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { NailCustomOrder, NailCustomOrderStatus } from "@/lib/types";

const STATUSES: NailCustomOrderStatus[] = [
  "quote_pending", "quoted", "confirmed", "in_progress", "shipped", "cancelled",
];
const STATUS_LABEL: Record<string, string> = {
  quote_pending: "Quote pending", quoted: "Quote sent",
  confirmed: "Confirmed", in_progress: "In progress",
  shipped: "Shipped", cancelled: "Cancelled",
};
const FINISH_LABEL: Record<string, string> = {
  glossy_top_coat: "Glossy Top Coat",
  matte_top_coat: "Matte Top Coat",
  glittery_top_coat: "Glittery Top Coat",
  silvery_top_coat: "Silvery Top Coat",
};

interface Props {
  order: NailCustomOrder & { profiles?: { full_name: string | null; email: string | null } | null };
  sizing: { sizes: Record<string, string>; submitted_at: string } | null;
  extraNames: string[];
}

export default function CustomOrderDetail({ order, sizing, extraNames }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [finalPrice, setFinalPrice] = useState(
    order.final_price_cents ? String(order.final_price_cents / 100) : "",
  );
  const [status, setStatus] = useState<NailCustomOrderStatus>(order.status);
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    const url = `${window.location.origin}/nails/orders/${order.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSave() {
    setSaving(true);
    const finalCents = finalPrice ? Math.round(parseFloat(finalPrice) * 100) : null;
    const { error } = await supabase
      .from("nail_custom_orders")
      .update({
        final_price_cents: finalCents,
        status,
        admin_notes: adminNotes || null,
      })
      .eq("id", order.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  }

  const design = order.design as Record<string, string | null>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Left: order details */}
      <div className="flex flex-col gap-5">
        <div className="ds-card p-6">
          <h1 className="text-xl font-black text-zinc-900 mb-1">
            Custom Order — {order.shape} · {order.length.replace("_", " ")} · {FINISH_LABEL[order.finish] ?? order.finish}
          </h1>
          <p className="text-sm text-zinc-400">
            {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          {order.profiles && (
            <p className="mt-2 text-sm font-semibold text-zinc-600">
              {order.profiles.full_name ?? "—"} · {order.profiles.email ?? ""}
            </p>
          )}
        </div>

        {/* Design & extras */}
        <div className="ds-card p-6 flex flex-col gap-4">
          <h2 className="font-black text-zinc-800">Design Details</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="font-semibold text-zinc-400">Type</dt>
            <dd className="text-zinc-800 capitalize">{design.type?.replace("_", " ") ?? "—"}</dd>
            {design.color && (
              <>
                <dt className="font-semibold text-zinc-400">Color</dt>
                <dd className="text-zinc-800">{design.color}</dd>
              </>
            )}
            {design.notes && (
              <>
                <dt className="font-semibold text-zinc-400">Notes</dt>
                <dd className="text-zinc-800">{design.notes}</dd>
              </>
            )}
          </dl>

          {extraNames.length > 0 && (
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Extras</p>
              <div className="flex flex-wrap gap-2">
                {extraNames.map((name) => (
                  <span key={name} className="border-2 border-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-800 bg-white">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {order.reference_images && order.reference_images.length > 0 && (
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Reference images</p>
              <div className="flex flex-wrap gap-2">
                {order.reference_images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`ref ${i + 1}`} className="h-20 w-20 rounded-xl object-cover ring-1 ring-zinc-200 hover:ring-fuchsia-400 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sizing */}
        <div className="ds-card p-6">
          <h2 className="font-black text-zinc-800 mb-3">Customer Sizes</h2>
          {sizing ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-400">
                Submitted {new Date(sizing.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-sm">
                {Object.entries(sizing.sizes).filter(([, v]) => v).map(([finger, size]) => (
                  <div key={finger} className="flex justify-between rounded-lg bg-violet-50 px-3 py-1.5">
                    <span className="text-zinc-500">{finger}</span>
                    <span className="font-bold text-violet-700">{size}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No sizing submission on file for this customer.</p>
          )}
        </div>
      </div>

      {/* Right: quote & status panel */}
      <div className="flex flex-col gap-4">
        <div className="ds-card p-6 flex flex-col gap-4 sticky top-6">
          <h2 className="font-black text-zinc-800">Quote & Status</h2>

          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1">Estimated price</p>
            <p className="text-sm text-zinc-500">
              ${order.calculated_price_cents ? (order.calculated_price_cents / 100).toFixed(2) : "—"}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">
              Final quoted price ($)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="e.g. 35.00"
              className="ds-input text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as NailCustomOrderStatus)}
              className="ds-input text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">
              Admin notes (visible to customer)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Quote sent via email, awaiting confirmation..."
              className="ds-input text-sm resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="ds-btn-primary w-full disabled:opacity-40"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>

          <button
            onClick={handleCopyLink}
            type="button"
            className="ds-btn-ghost w-full"
          >
            {copied ? "Link copied ✓" : "Copy quote link for customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
