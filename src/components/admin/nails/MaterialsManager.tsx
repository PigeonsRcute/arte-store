"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NailMaterial } from "@/lib/types";

const EMPTY = { name: "", unit: "", supplier: "", cost_cents: 0, stock_qty: 0 };

interface Props {
  initialMaterials: NailMaterial[];
}

export default function MaterialsManager({ initialMaterials }: Props) {
  const supabase = createClient();
  const [materials, setMaterials] = useState(initialMaterials);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NailMaterial | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(m: NailMaterial) {
    setEditing(m);
    setForm({ name: m.name, unit: m.unit, supplier: m.supplier ?? "", cost_cents: m.cost_cents, stock_qty: Number(m.stock_qty) });
    setShowForm(true);
  }
  function cancel() { setShowForm(false); setEditing(null); setError(null); }

  const sel = (key: keyof typeof form, val: unknown) => setForm((p) => ({ ...p, [key]: val }));

  async function handleSave() {
    setSaving(true); setError(null);
    const payload = { name: form.name, unit: form.unit, supplier: form.supplier || null, cost_cents: form.cost_cents, stock_qty: form.stock_qty };

    if (editing) {
      const { data, error: err } = await supabase.from("nail_materials").update(payload).eq("id", editing.id).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setMaterials((p) => p.map((m) => (m.id === editing.id ? (data as NailMaterial) : m)));
    } else {
      const { data, error: err } = await supabase.from("nail_materials").insert(payload).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setMaterials((p) => [data as NailMaterial, ...p]);
    }
    setSaving(false); cancel();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material?")) return;
    const { error: err } = await supabase.from("nail_materials").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setMaterials((p) => p.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {!showForm && (
        <button onClick={openAdd} className="self-start rounded-full bg-purple-500 px-5 py-2 text-sm font-bold text-white hover:bg-purple-600 transition">
          + Add material
        </button>
      )}

      {showForm && (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-purple-200 flex flex-col gap-4">
          <h2 className="font-black text-zinc-800">{editing ? "Edit material" : "New material"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Name"><input value={form.name} onChange={(e) => sel("name", e.target.value)} className={i} placeholder="Rhinestone gems" /></F>
            <F label="Unit"><input value={form.unit} onChange={(e) => sel("unit", e.target.value)} className={i} placeholder="piece, gram, ml..." /></F>
            <F label="Cost per unit (cents)"><input type="number" min={0} value={form.cost_cents} onChange={(e) => sel("cost_cents", +e.target.value)} className={i} /></F>
            <F label="Stock qty"><input type="number" min={0} value={form.stock_qty} onChange={(e) => sel("stock_qty", +e.target.value)} className={i} /></F>
            <F label="Supplier" className="sm:col-span-2"><input value={form.supplier} onChange={(e) => sel("supplier", e.target.value)} className={i} placeholder="Optional" /></F>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.name} className="rounded-full bg-purple-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-purple-600 transition">
              {saving ? "Saving…" : editing ? "Save changes" : "Add material"}
            </button>
            <button onClick={cancel} className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white ring-1 ring-zinc-200 overflow-hidden">
        {materials.length === 0 ? (
          <p className="p-8 text-center text-zinc-400">No materials added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Cost / unit</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 font-semibold text-zinc-800">{m.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{m.unit}</td>
                  <td className="px-4 py-3">${(m.cost_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">{m.stock_qty}</td>
                  <td className="px-4 py-3 text-zinc-500">{m.supplier ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(m)} className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(m.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const i = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none";
function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
