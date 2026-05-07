"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NailProduct, NailShape, NailLength, NailFinish } from "@/lib/types";

const SHAPES: NailShape[] = ["coffin", "almond", "square", "stiletto", "oval", "ballerina"];
const LENGTHS: NailLength[] = ["short", "medium", "long", "extra_long"];
const FINISHES: NailFinish[] = ["glossy_top_coat", "matte_top_coat", "glittery_top_coat", "silvery_top_coat"];

const EMPTY_FORM = {
  name: "", slug: "", description: "",
  shape: "coffin" as NailShape, length: "medium" as NailLength, finish: "glossy_top_coat" as NailFinish,
  price_cents: 0, stock_qty: 0, is_published: false,
};

interface Props {
  initialProducts: NailProduct[];
}

export default function NailProductManager({ initialProducts }: Props) {
  const supabase = createClient();
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NailProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: NailProduct) {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description ?? "",
      shape: p.shape, length: p.length, finish: p.finish,
      price_cents: p.price_cents, stock_qty: p.stock_qty, is_published: p.is_published,
    });
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditing(null);
    setError(null);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      slug: form.slug || autoSlug(form.name),
      description: form.description || null,
      shape: form.shape,
      length: form.length,
      finish: form.finish,
      price_cents: form.price_cents,
      stock_qty: form.stock_qty,
      is_published: form.is_published,
    };

    if (editing) {
      const { data, error: err } = await supabase
        .from("nail_products")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (err) { setError(err.message); setSaving(false); return; }
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? (data as NailProduct) : p)));
    } else {
      const { data, error: err } = await supabase
        .from("nail_products")
        .insert(payload)
        .select()
        .single();
      if (err) { setError(err.message); setSaving(false); return; }
      setProducts((prev) => [data as NailProduct, ...prev]);
    }

    setSaving(false);
    cancel();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this nail product?")) return;
    const { error: err } = await supabase.from("nail_products").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function togglePublished(p: NailProduct) {
    const { data, error: err } = await supabase
      .from("nail_products")
      .update({ is_published: !p.is_published })
      .eq("id", p.id)
      .select()
      .single();
    if (err) { alert(err.message); return; }
    setProducts((prev) => prev.map((x) => (x.id === p.id ? (data as NailProduct) : x)));
  }

  const sel = (key: keyof typeof form, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="flex flex-col gap-4">
      {!showForm && (
        <button
          onClick={openAdd}
          className="self-start rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-bold text-white hover:bg-fuchsia-600 transition"
        >
          + Add product
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-fuchsia-200 flex flex-col gap-4">
          <h2 className="font-black text-zinc-800">{editing ? "Edit product" : "New product"}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => { sel("name", e.target.value); if (!editing) sel("slug", autoSlug(e.target.value)); }}
                className={input}
                placeholder="Rosy Coffin Set"
              />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(e) => sel("slug", e.target.value)} className={input} placeholder="rosy-coffin-set" />
            </Field>
            <Field label="Price (cents)" hint="e.g. 2800 = $28.00">
              <input type="number" min={0} value={form.price_cents} onChange={(e) => sel("price_cents", +e.target.value)} className={input} />
            </Field>
            <Field label="Stock qty">
              <input type="number" min={0} value={form.stock_qty} onChange={(e) => sel("stock_qty", +e.target.value)} className={input} />
            </Field>
            <Field label="Shape">
              <select value={form.shape} onChange={(e) => sel("shape", e.target.value)} className={input}>
                {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Length">
              <select value={form.length} onChange={(e) => sel("length", e.target.value)} className={input}>
                {LENGTHS.map((l) => <option key={l} value={l}>{l.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="Finish">
              <select value={form.finish} onChange={(e) => sel("finish", e.target.value)} className={input}>
                {FINISHES.map((f) => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => sel("description", e.target.value)} rows={2} className={input} placeholder="Optional description..." />
          </Field>

          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600 cursor-pointer">
            <input type="checkbox" checked={form.is_published} onChange={(e) => sel("is_published", e.target.checked)} className="rounded" />
            Published (visible in shop)
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.name} className="rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-fuchsia-600 transition">
              {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
            </button>
            <button onClick={cancel} className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="rounded-2xl bg-white ring-1 ring-zinc-200 overflow-hidden">
        {products.length === 0 ? (
          <p className="p-8 text-center text-zinc-400">No nail products yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Shape / Length / Finish</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 font-semibold text-zinc-800">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-500 capitalize">{p.shape} · {p.length.replace("_", " ")} · {p.finish.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">${(p.price_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">{p.stock_qty}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublished(p)} className={`rounded-full px-2 py-0.5 text-xs font-bold transition ${p.is_published ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {p.is_published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
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

const input = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-fuchsia-400 focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{label}{hint && <span className="ml-1 font-normal normal-case text-zinc-400">({hint})</span>}</label>
      {children}
    </div>
  );
}
