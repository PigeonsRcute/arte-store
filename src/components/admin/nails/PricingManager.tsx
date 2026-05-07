"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NailPricingRule, NailExtra, NailShape, NailLength, NailCostType } from "@/lib/types";

const SHAPES: NailShape[] = ["coffin", "almond", "square", "stiletto", "oval", "ballerina"];
const LENGTHS: NailLength[] = ["short", "medium", "long", "extra_long"];

interface Props {
  initialRules: NailPricingRule[];
  initialExtras: NailExtra[];
}

export default function PricingManager({ initialRules, initialExtras }: Props) {
  const supabase = createClient();
  const [rules, setRules] = useState(initialRules);
  const [extras, setExtras] = useState(initialExtras);

  // Pricing grid editing
  const [editingRule, setEditingRule] = useState<{ shape: NailShape; length: NailLength; cents: string } | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  // Extras editing
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [editingExtra, setEditingExtra] = useState<NailExtra | null>(null);
  const [extraForm, setExtraForm] = useState({ name: "", cost_type: "flat" as NailCostType, cost_cents: 0, description: "", is_active: true });
  const [savingExtra, setSavingExtra] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);

  // Live calculator
  const [calcShape, setCalcShape] = useState<NailShape>("coffin");
  const [calcLength, setCalcLength] = useState<NailLength>("medium");
  const [calcExtras, setCalcExtras] = useState<string[]>([]);

  function getRule(shape: NailShape, length: NailLength) {
    return rules.find((r) => r.shape === shape && r.length === length);
  }

  function calcTotal() {
    const base = getRule(calcShape, calcLength)?.base_price_cents ?? 0;
    const extraCost = calcExtras.reduce((sum, id) => {
      const e = extras.find((x) => x.id === id);
      if (!e) return sum;
      return sum + (e.cost_type === "per_unit" ? e.cost_cents * 10 : e.cost_cents);
    }, 0);
    return base + extraCost;
  }

  async function saveRule() {
    if (!editingRule) return;
    setSavingRule(true);
    const cents = Math.round(parseFloat(editingRule.cents) * 100);
    const { data, error } = await supabase
      .from("nail_pricing_rules")
      .upsert({ shape: editingRule.shape, length: editingRule.length, base_price_cents: cents }, { onConflict: "shape,length" })
      .select()
      .single();
    if (!error && data) {
      setRules((prev) => {
        const exists = prev.find((r) => r.shape === editingRule.shape && r.length === editingRule.length);
        if (exists) return prev.map((r) => (r.shape === editingRule.shape && r.length === editingRule.length ? (data as NailPricingRule) : r));
        return [...prev, data as NailPricingRule];
      });
    }
    setSavingRule(false);
    setEditingRule(null);
  }

  function openEditRule(shape: NailShape, length: NailLength) {
    const rule = getRule(shape, length);
    setEditingRule({ shape, length, cents: rule ? String(rule.base_price_cents / 100) : "" });
  }

  async function saveExtra() {
    setSavingExtra(true); setExtraError(null);
    const payload = { name: extraForm.name, cost_type: extraForm.cost_type, cost_cents: extraForm.cost_cents, description: extraForm.description || null, is_active: extraForm.is_active };
    if (editingExtra) {
      const { data, error } = await supabase.from("nail_extras").update(payload).eq("id", editingExtra.id).select().single();
      if (error) { setExtraError(error.message); setSavingExtra(false); return; }
      setExtras((p) => p.map((e) => (e.id === editingExtra.id ? (data as NailExtra) : e)));
    } else {
      const { data, error } = await supabase.from("nail_extras").insert(payload).select().single();
      if (error) { setExtraError(error.message); setSavingExtra(false); return; }
      setExtras((p) => [...p, data as NailExtra]);
    }
    setSavingExtra(false); setShowExtraForm(false); setEditingExtra(null);
  }

  function openEditExtra(e: NailExtra) {
    setEditingExtra(e);
    setExtraForm({ name: e.name, cost_type: e.cost_type, cost_cents: e.cost_cents, description: e.description ?? "", is_active: e.is_active });
    setShowExtraForm(true);
  }

  async function toggleExtra(e: NailExtra) {
    const { data } = await supabase.from("nail_extras").update({ is_active: !e.is_active }).eq("id", e.id).select().single();
    if (data) setExtras((p) => p.map((x) => (x.id === e.id ? (data as NailExtra) : x)));
  }

  const ef = (key: keyof typeof extraForm, val: unknown) => setExtraForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-8">
        {/* Pricing grid */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200">
          <h2 className="font-black text-zinc-800 mb-4">Base price matrix</h2>
          <p className="text-xs text-zinc-400 mb-4">Click any cell to edit. All values in USD.</p>
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400 uppercase">Shape</th>
                  {LENGTHS.map((l) => (
                    <th key={l} className="px-3 py-2 text-center text-xs font-bold text-zinc-500 uppercase whitespace-nowrap">
                      {l.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {SHAPES.map((shape) => (
                  <tr key={shape} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 font-bold text-zinc-700 capitalize">{shape}</td>
                    {LENGTHS.map((length) => {
                      const rule = getRule(shape, length);
                      const isEditing = editingRule?.shape === shape && editingRule?.length === length;
                      return (
                        <td key={length} className="px-3 py-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-400">$</span>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={editingRule.cents}
                                onChange={(e) => setEditingRule((r) => r ? { ...r, cents: e.target.value } : r)}
                                autoFocus
                                className="w-20 rounded border border-indigo-300 px-2 py-1 text-sm focus:outline-none"
                              />
                              <button onClick={saveRule} disabled={savingRule} className="rounded bg-indigo-500 px-2 py-1 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-40">
                                {savingRule ? "…" : "✓"}
                              </button>
                              <button onClick={() => setEditingRule(null)} className="text-xs text-zinc-400 hover:text-zinc-600">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openEditRule(shape, length)}
                              className="rounded-lg px-3 py-1.5 font-semibold text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                            >
                              {rule ? `$${(rule.base_price_cents / 100).toFixed(2)}` : <span className="text-zinc-300">—</span>}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Extras */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-zinc-800">Extras</h2>
            {!showExtraForm && (
              <button onClick={() => { setEditingExtra(null); setExtraForm({ name: "", cost_type: "flat", cost_cents: 0, description: "", is_active: true }); setShowExtraForm(true); }}
                className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 transition">
                + Add extra
              </button>
            )}
          </div>

          {showExtraForm && (
            <div className="mb-5 rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200 flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <F label="Name"><input value={extraForm.name} onChange={(e) => ef("name", e.target.value)} className={inp} placeholder="Gems" /></F>
                <F label="Cost type">
                  <select value={extraForm.cost_type} onChange={(e) => ef("cost_type", e.target.value)} className={inp}>
                    <option value="flat">Flat (once)</option>
                    <option value="per_unit">Per nail (×10)</option>
                  </select>
                </F>
                <F label="Cost (cents)"><input type="number" min={0} value={extraForm.cost_cents} onChange={(e) => ef("cost_cents", +e.target.value)} className={inp} /></F>
                <F label="Description"><input value={extraForm.description} onChange={(e) => ef("description", e.target.value)} className={inp} placeholder="Optional" /></F>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600 cursor-pointer">
                <input type="checkbox" checked={extraForm.is_active} onChange={(e) => ef("is_active", e.target.checked)} />
                Active (shown in custom order builder)
              </label>
              {extraError && <p className="text-sm text-red-500">{extraError}</p>}
              <div className="flex gap-2">
                <button onClick={saveExtra} disabled={savingExtra || !extraForm.name} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-indigo-600 transition">
                  {savingExtra ? "Saving…" : editingExtra ? "Save" : "Add"}
                </button>
                <button onClick={() => { setShowExtraForm(false); setEditingExtra(null); }} className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {extras.map((e) => (
              <div key={e.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ${e.is_active ? "bg-white ring-zinc-200" : "bg-zinc-50 ring-zinc-100 opacity-60"}`}>
                <div>
                  <span className="font-bold text-zinc-800">{e.name}</span>
                  {e.description && <span className="ml-2 text-xs text-zinc-400">{e.description}</span>}
                  <span className="ml-3 text-sm text-indigo-600 font-semibold">
                    {e.cost_type === "per_unit" ? `$${(e.cost_cents / 100).toFixed(2)} / nail` : `$${(e.cost_cents / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <button onClick={() => toggleExtra(e)} className={`text-xs font-bold ${e.is_active ? "text-green-600" : "text-zinc-400"} hover:underline`}>
                    {e.is_active ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => openEditExtra(e)} className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live calculator */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-indigo-200 h-fit sticky top-6">
        <h2 className="font-black text-zinc-800 mb-4">Live calculator</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <label className="block mb-1 text-xs font-bold text-zinc-400 uppercase">Shape</label>
            <select value={calcShape} onChange={(e) => setCalcShape(e.target.value as NailShape)} className={inp}>
              {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-xs font-bold text-zinc-400 uppercase">Length</label>
            <select value={calcLength} onChange={(e) => setCalcLength(e.target.value as NailLength)} className={inp}>
              {LENGTHS.map((l) => <option key={l} value={l}>{l.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-zinc-400 uppercase">Extras</p>
            {extras.filter((e) => e.is_active).map((e) => (
              <label key={e.id} className="flex items-center gap-2 py-1 cursor-pointer text-zinc-600">
                <input
                  type="checkbox"
                  checked={calcExtras.includes(e.id)}
                  onChange={() => setCalcExtras((p) => p.includes(e.id) ? p.filter((x) => x !== e.id) : [...p, e.id])}
                />
                {e.name}
              </label>
            ))}
          </div>
          <div className="mt-2 rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-100">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-zinc-500">
                <span>Base</span>
                <span>${((getRule(calcShape, calcLength)?.base_price_cents ?? 0) / 100).toFixed(2)}</span>
              </div>
              {calcExtras.map((id) => {
                const e = extras.find((x) => x.id === id);
                if (!e) return null;
                const cost = e.cost_type === "per_unit" ? e.cost_cents * 10 : e.cost_cents;
                return (
                  <div key={id} className="flex justify-between text-zinc-500">
                    <span>{e.name}</span>
                    <span>+${(cost / 100).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="mt-2 flex justify-between border-t border-indigo-100 pt-2 font-black text-indigo-700">
                <span>Total</span>
                <span>${(calcTotal() / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
