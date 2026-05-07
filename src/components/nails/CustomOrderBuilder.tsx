"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  NailShape, NailLength, NailFinish, NailPricingRule, NailExtra,
} from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type DesignType = "solid" | "gradient" | "pattern" | "custom_art" | "reference";

interface OrderState {
  shape: NailShape | null;
  length: NailLength | null;
  finish: NailFinish | null;
  designType: DesignType | null;
  designColor: string;
  extras: string[]; // extra ids
  sizes: Record<string, string>; // finger → size
  referenceImages: File[];
  notes: string;
}

const SHAPES: Array<{ value: NailShape; label: string; emoji: string }> = [
  { value: "coffin",    label: "Coffin",    emoji: "⬡" },
  { value: "almond",   label: "Almond",    emoji: "◇" },
  { value: "square",   label: "Square",    emoji: "□" },
  { value: "stiletto", label: "Stiletto",  emoji: "△" },
  { value: "oval",     label: "Oval",      emoji: "○" },
  { value: "ballerina",label: "Ballerina", emoji: "⬡" },
];

const LENGTHS: Array<{ value: NailLength; label: string; desc: string }> = [
  { value: "short",      label: "Short",      desc: "Everyday, low-maintenance" },
  { value: "medium",     label: "Medium",     desc: "Versatile, balanced look" },
  { value: "long",       label: "Long",       desc: "Bold, statement-ready" },
  { value: "extra_long", label: "Extra Long", desc: "Drama, for the brave" },
];

const FINISHES: Array<{ value: NailFinish; label: string; desc: string }> = [
  { value: "glossy_top_coat",   label: "Glossy top coat",   desc: "Classic high-shine seal" },
  { value: "matte_top_coat",    label: "Matte top coat",    desc: "Soft, non-reflective surface" },
  { value: "glittery_top_coat", label: "Glittery top coat", desc: "Sparkle-packed glitter overlay" },
  { value: "silvery_top_coat",  label: "Silvery top coat",  desc: "Metallic silver mirror finish" },
];

const DESIGN_TYPES: Array<{ value: DesignType; label: string; desc: string }> = [
  { value: "solid",      label: "Solid color",    desc: "One color, clean and precise" },
  { value: "gradient",   label: "Gradient",       desc: "Two colors blending" },
  { value: "pattern",    label: "Pattern",        desc: "Floral, abstract, geometric..." },
  { value: "custom_art", label: "Custom art",     desc: "Describe or upload a reference" },
  { value: "reference",  label: "Reference image",desc: "Upload photos for inspiration" },
];

const FINGERS = [
  "Thumb L", "Index L", "Middle L", "Ring L", "Pinky L",
  "Thumb R", "Index R", "Middle R", "Ring R", "Pinky R",
];
const SIZES = ["XS", "S", "M", "L", "XL"];

const STEPS = [
  "Shape", "Length", "Finish", "Design", "Extras", "Sizes", "Review", "Confirm",
];

// ─── Price calculator ─────────────────────────────────────────────────────────

function calcPrice(
  state: OrderState,
  rules: NailPricingRule[],
  allExtras: NailExtra[],
): number {
  if (!state.shape || !state.length) return 0;
  const rule = rules.find((r) => r.shape === state.shape && r.length === state.length);
  const base = rule?.base_price_cents ?? 0;

  const extraCost = state.extras.reduce((sum, id) => {
    const extra = allExtras.find((e) => e.id === id);
    if (!extra) return sum;
    // per_unit charges per nail (10 nails), flat is once
    return sum + (extra.cost_type === "per_unit" ? extra.cost_cents * 10 : extra.cost_cents);
  }, 0);

  return base + extraCost;
}

// ─── Option button helper ─────────────────────────────────────────────────────

function OptionBtn({
  selected, onClick, children, className = "",
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left transition ${
        selected
          ? "border-fuchsia-400 bg-fuchsia-50 ring-2 ring-fuchsia-200"
          : "border-pink-100 bg-white/70 hover:border-fuchsia-200 hover:bg-fuchsia-50/30"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  pricingRules: NailPricingRule[];
  extras: NailExtra[];
}

export default function CustomOrderBuilder({ pricingRules, extras }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [order, setOrder] = useState<OrderState>({
    shape: null, length: null, finish: null,
    designType: null, designColor: "",
    extras: [], sizes: {}, referenceImages: [], notes: "",
  });

  const set = useCallback(<K extends keyof OrderState>(key: K, val: OrderState[K]) => {
    setOrder((prev) => ({ ...prev, [key]: val }));
  }, []);

  const totalCents = calcPrice(order, pricingRules, extras);
  const canAdvance = (): boolean => {
    if (step === 0) return !!order.shape;
    if (step === 1) return !!order.length;
    if (step === 2) return !!order.finish;
    if (step === 3) return !!order.designType;
    if (step === 4) return true; // extras optional
    if (step === 5) return true; // sizes optional (can link kit later)
    if (step === 6) return true; // review
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { router.push("/login?reason=signin_required&next=/nails/custom"); return; }

    // Upload reference images to Supabase Storage (nail-references bucket)
    const uploadedUrls: string[] = [];
    for (const file of order.referenceImages) {
      const path = `${authData.user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("nail-references")
        .upload(path, file);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("nail-references").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const { error } = await supabase.from("nail_custom_orders").insert({
      user_id: authData.user.id,
      shape: order.shape,
      length: order.length,
      finish: order.finish,
      design: {
        type: order.designType,
        color: order.designColor || null,
        notes: order.notes || null,
      },
      extras: order.extras,
      sizes: order.sizes,
      reference_images: uploadedUrls,
      calculated_price_cents: totalCents,
    });

    if (error) {
      console.error("[nail-custom-order insert]", error);
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    router.push("/nails/orders");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs font-bold text-zinc-400">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-2 rounded-full bg-pink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex-1 rounded-full py-0.5 text-[10px] font-bold transition ${
                i === step ? "bg-fuchsia-500 text-white" :
                i < step ? "bg-fuchsia-100 text-fuchsia-600 cursor-pointer hover:bg-fuchsia-200" :
                "bg-zinc-100 text-zinc-400 cursor-default"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-3xl bg-white/80 p-8 ring-1 ring-pink-100 min-h-[360px] flex flex-col gap-6">

        {/* Step 0: Shape */}
        {step === 0 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Choose your shape</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SHAPES.map(({ value, label, emoji }) => (
                <OptionBtn key={value} selected={order.shape === value} onClick={() => set("shape", value)}>
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="font-bold text-zinc-800">{label}</div>
                </OptionBtn>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Length */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Choose your length</h2>
            <div className="flex flex-col gap-3">
              {LENGTHS.map(({ value, label, desc }) => (
                <OptionBtn key={value} selected={order.length === value} onClick={() => set("length", value)}>
                  <div className="font-bold text-zinc-800">{label}</div>
                  <div className="text-sm text-zinc-500">{desc}</div>
                </OptionBtn>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Finish */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Choose your finish</h2>
            <div className="flex flex-col gap-3">
              {FINISHES.map(({ value, label, desc }) => (
                <OptionBtn key={value} selected={order.finish === value} onClick={() => set("finish", value)}>
                  <div className="font-bold text-zinc-800">{label}</div>
                  <div className="text-sm text-zinc-500">{desc}</div>
                </OptionBtn>
              ))}
            </div>
          </>
        )}

        {/* Step 3: Design */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Choose your design</h2>
            <div className="flex flex-col gap-3">
              {DESIGN_TYPES.map(({ value, label, desc }) => (
                <OptionBtn key={value} selected={order.designType === value} onClick={() => set("designType", value)}>
                  <div className="font-bold text-zinc-800">{label}</div>
                  <div className="text-sm text-zinc-500">{desc}</div>
                </OptionBtn>
              ))}
            </div>
            {(order.designType === "solid" || order.designType === "gradient") && (
              <div>
                <label className="block mb-1 text-sm font-semibold text-zinc-600">
                  Color preference (e.g. "dusty rose", "#FF69B4")
                </label>
                <input
                  type="text"
                  value={order.designColor}
                  onChange={(e) => set("designColor", e.target.value)}
                  placeholder="Describe the color..."
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm focus:border-fuchsia-400 focus:outline-none"
                />
              </div>
            )}
            {(order.designType === "custom_art" || order.designType === "pattern") && (
              <div>
                <label className="block mb-1 text-sm font-semibold text-zinc-600">
                  Describe your design idea
                </label>
                <textarea
                  value={order.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  placeholder="Floral swirls, butterflies, a specific vibe..."
                  className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm focus:border-fuchsia-400 focus:outline-none resize-none"
                />
              </div>
            )}
            {(order.designType === "reference" || order.designType === "custom_art") && (
              <div>
                <label className="block mb-1 text-sm font-semibold text-zinc-600">
                  Upload reference images (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => set("referenceImages", Array.from(e.target.files ?? []))}
                  className="w-full text-sm text-zinc-500 file:mr-3 file:rounded-full file:border-0 file:bg-fuchsia-50 file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-fuchsia-700"
                />
                {order.referenceImages.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {order.referenceImages.length} file{order.referenceImages.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 4: Extras */}
        {step === 4 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Add extras</h2>
            <p className="text-sm text-zinc-500">Optional — select as many as you like.</p>
            <div className="flex flex-col gap-3">
              {extras.map((extra) => {
                const selected = order.extras.includes(extra.id);
                const costLabel =
                  extra.cost_type === "per_unit"
                    ? `+$${(extra.cost_cents / 100).toFixed(2)} per nail`
                    : `+$${(extra.cost_cents / 100).toFixed(2)}`;
                return (
                  <OptionBtn
                    key={extra.id}
                    selected={selected}
                    onClick={() =>
                      set(
                        "extras",
                        selected
                          ? order.extras.filter((id) => id !== extra.id)
                          : [...order.extras, extra.id],
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-zinc-800">{extra.name}</div>
                        {extra.description && (
                          <div className="text-sm text-zinc-500">{extra.description}</div>
                        )}
                      </div>
                      <span className="ml-4 whitespace-nowrap text-sm font-bold text-fuchsia-600">
                        {costLabel}
                      </span>
                    </div>
                  </OptionBtn>
                );
              })}
            </div>
          </>
        )}

        {/* Step 5: Sizes */}
        {step === 5 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Enter your sizes</h2>
            <p className="text-sm text-zinc-500">
              Skip this step if you{"'"}d like to submit sizes after receiving your{" "}
              <a href="/nails/sizing-kit" className="text-fuchsia-600 underline">
                free sizing kit
              </a>
              .
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FINGERS.map((finger) => (
                <div key={finger}>
                  <label className="mb-1 block text-xs font-semibold text-zinc-500">{finger}</label>
                  <select
                    value={order.sizes[finger] ?? ""}
                    onChange={(e) =>
                      set("sizes", { ...order.sizes, [finger]: e.target.value })
                    }
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-sm focus:border-fuchsia-400 focus:outline-none"
                  >
                    <option value="">—</option>
                    {SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Review your order</h2>
            <div className="flex flex-col gap-3 text-sm">
              <Row label="Shape" value={order.shape ?? "—"} />
              <Row label="Length" value={order.length?.replace("_", " ") ?? "—"} />
              <Row label="Finish" value={order.finish ?? "—"} />
              <Row label="Design" value={order.designType?.replace("_", " ") ?? "—"} />
              {order.designColor && <Row label="Color" value={order.designColor} />}
              {order.extras.length > 0 && (
                <Row
                  label="Extras"
                  value={order.extras
                    .map((id) => extras.find((e) => e.id === id)?.name ?? id)
                    .join(", ")}
                />
              )}
              {Object.keys(order.sizes).filter((k) => order.sizes[k]).length > 0 && (
                <Row
                  label="Sizes"
                  value={Object.entries(order.sizes)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                />
              )}
              {order.referenceImages.length > 0 && (
                <Row label="Reference images" value={`${order.referenceImages.length} uploaded`} />
              )}
              {order.notes && <Row label="Notes" value={order.notes} />}
            </div>

            {/* Live price summary */}
            <div className="mt-2 rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 p-5 ring-1 ring-fuchsia-100">
              <p className="mb-3 text-xs font-black tracking-widest text-fuchsia-400">ESTIMATED PRICE</p>
              {(() => {
                const rule = pricingRules.find(
                  (r) => r.shape === order.shape && r.length === order.length,
                );
                const base = rule?.base_price_cents ?? 0;
                const extraLines = order.extras.map((id) => {
                  const e = extras.find((x) => x.id === id);
                  if (!e) return null;
                  const cost = e.cost_type === "per_unit" ? e.cost_cents * 10 : e.cost_cents;
                  return { name: e.name, cost };
                }).filter(Boolean) as Array<{ name: string; cost: number }>;
                return (
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between text-zinc-600">
                      <span>Base ({order.shape}, {order.length?.replace("_", " ")})</span>
                      <span>${(base / 100).toFixed(2)}</span>
                    </div>
                    {extraLines.map(({ name, cost }) => (
                      <div key={name} className="flex justify-between text-zinc-600">
                        <span>{name}</span>
                        <span>+${(cost / 100).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between border-t border-fuchsia-100 pt-2 font-black text-zinc-900">
                      <span>Estimated total</span>
                      <span className="text-fuchsia-700">${(totalCents / 100).toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      A final quote will be sent before any payment is taken.
                    </p>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* Step 7: Confirm */}
        {step === 7 && (
          <>
            <h2 className="text-2xl font-black text-zinc-800">Ready to submit?</h2>
            <p className="text-zinc-600">
              Your order request will be sent. We{"'"}ll review it and send you a final quote
              before any payment is taken.
            </p>
            <div className="flex items-center justify-between rounded-2xl bg-fuchsia-50 p-5 ring-1 ring-fuchsia-100">
              <span className="font-semibold text-zinc-700">Estimated total</span>
              <span className="text-2xl font-black text-fuchsia-700">
                ${(totalCents / 100).toFixed(2)}
              </span>
            </div>
            {submitError && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-200">
                {submitError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 py-4 font-black text-white text-lg shadow-lg shadow-pink-200 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Custom Order"}
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-full border border-pink-200 px-6 py-2 font-semibold text-zinc-600 transition hover:bg-pink-50 disabled:opacity-30"
        >
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-2 font-bold text-white transition hover:scale-105 disabled:opacity-40"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-pink-50 pb-2">
      <span className="font-semibold text-zinc-400">{label}</span>
      <span className="text-right font-semibold text-zinc-800 capitalize">{value}</span>
    </div>
  );
}
