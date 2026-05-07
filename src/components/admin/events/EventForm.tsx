"use client";

import Image from "next/image";
import type { Category, DiscountType } from "@/lib/types";

export type ProductOption = { id: string; title: string; image_url: string | null };

export type EventFormValues = {
  name: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  free_shipping_threshold: string; // euros as string, empty = use global
  scope: "categories" | "products" | "both";
  category_ids: string[];
  product_ids: string[];
  launch_mode: "immediate" | "scheduled";
  starts_at: string;
  ends_at: string;
};

type EventFormProps = {
  values: EventFormValues;
  mode: "create" | "edit";
  busy: boolean;
  bannerPreview: string | null;
  categories: Pick<Category, "id" | "name" | "gradient_from" | "gradient_to">[];
  products: ProductOption[];
  productSearch: string;
  onProductSearchChange: (v: string) => void;
  onChange: (name: keyof EventFormValues, value: EventFormValues[keyof EventFormValues]) => void;
  onBannerSelected: (file: File | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function EventForm({
  values,
  mode,
  busy,
  bannerPreview,
  categories,
  products,
  productSearch,
  onProductSearchChange,
  onChange,
  onBannerSelected,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const toggleId = (field: "category_ids" | "product_ids", id: string) => {
    const current = values[field];
    onChange(
      field,
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border border-rose-200 bg-rose-50/40 p-5"
    >
      <h2 className="text-lg font-bold text-rose-700">
        {mode === "edit" ? "Edit Event" : "New Event"}
      </h2>

      {/* Name + Description */}
      <label className="space-y-1">
        <span className="text-sm font-semibold text-zinc-700">Event name *</span>
        <input
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          required
        />
      </label>

      <label className="space-y-1">
        <span className="text-sm font-semibold text-zinc-700">Description</span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </label>

      {/* Banner */}
      <label className="space-y-1">
        <span className="text-sm font-semibold text-zinc-700">Banner image</span>
        <input
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          onChange={(e) => onBannerSelected(e.target.files?.[0] ?? null)}
        />
      </label>
      {bannerPreview && (
        <div className="relative h-28 w-full overflow-hidden rounded-xl border border-zinc-200">
          <Image src={bannerPreview} alt="Banner" fill className="object-cover" unoptimized />
        </div>
      )}

      {/* Discount type + value */}
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-zinc-700">Discount type *</legend>
          <div className="flex gap-3">
            {(["percent", "fixed"] as const).map((type) => (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="discount_type"
                  value={type}
                  checked={values.discount_type === type}
                  onChange={() => onChange("discount_type", type)}
                />
                {type === "percent" ? "% off" : "$ fixed off"}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">
            {values.discount_type === "percent" ? "Percent off *" : "Amount off (USD) *"}
          </span>
          <input
            type="number"
            min="0"
            step={values.discount_type === "percent" ? "1" : "0.01"}
            max={values.discount_type === "percent" ? "100" : undefined}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={values.discount_value}
            onChange={(e) => onChange("discount_value", e.target.value)}
            required
          />
        </label>
      </div>

      {/* Free shipping threshold */}
      <label className="space-y-1">
        <span className="text-sm font-semibold text-zinc-700">
          Free shipping threshold (€)
        </span>
        <div className="relative max-w-[180px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
            €
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 50.00"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={values.free_shipping_threshold}
            onChange={(e) => onChange("free_shipping_threshold", e.target.value)}
          />
        </div>
        <p className="text-xs text-zinc-400">
          Leave blank to use the global setting from the Shipping page.
        </p>
      </label>

      {/* Product scope tabs */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-zinc-700">Apply discount to</legend>
        <div className="flex gap-2">
          {(["categories", "products", "both"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange("scope", s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                values.scope === s
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {s === "categories" ? "By category" : s === "products" ? "Specific products" : "Both"}
            </button>
          ))}
        </div>

        {/* Category selection */}
        {(values.scope === "categories" || values.scope === "both") && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-600">Select categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const checked = values.category_ids.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleId("category_ids", cat.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      checked ? "border-transparent text-white" : "border-zinc-300 text-zinc-600"
                    }`}
                    style={
                      checked
                        ? { background: `linear-gradient(to right, ${cat.gradient_from}, ${cat.gradient_to})` }
                        : {}
                    }
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product selection */}
        {(values.scope === "products" || values.scope === "both") && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-600">Select products</p>
            <input
              placeholder="Search products…"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={productSearch}
              onChange={(e) => onProductSearchChange(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-zinc-200 bg-white p-2">
              {filteredProducts.length === 0 ? (
                <p className="py-2 text-center text-xs text-zinc-400">No products found.</p>
              ) : (
                filteredProducts.map((p) => {
                  const checked = values.product_ids.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                        checked ? "bg-rose-50" : "hover:bg-zinc-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId("product_ids", p.id)}
                        className="h-4 w-4 shrink-0"
                      />
                      {p.image_url && (
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded">
                          <Image src={p.image_url} alt={p.title} fill className="object-cover" sizes="28px" unoptimized />
                        </div>
                      )}
                      <span className="truncate font-medium">{p.title}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </fieldset>

      {/* Launch + end timing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-zinc-700">Launch</legend>
          <div className="flex gap-3">
            {(["immediate", "scheduled"] as const).map((lm) => (
              <label key={lm} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="launch_mode"
                  value={lm}
                  checked={values.launch_mode === lm}
                  onChange={() => onChange("launch_mode", lm)}
                />
                {lm === "immediate" ? "Immediately" : "Scheduled"}
              </label>
            ))}
          </div>
          {values.launch_mode === "scheduled" && (
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={values.starts_at}
              onChange={(e) => onChange("starts_at", e.target.value)}
            />
          )}
        </fieldset>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">End date (optional)</span>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            value={values.ends_at}
            onChange={(e) => onChange("ends_at", e.target.value)}
          />
          <p className="text-xs text-zinc-400">Leave blank for manual end.</p>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : mode === "edit" ? "Update Event" : "Create Event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
