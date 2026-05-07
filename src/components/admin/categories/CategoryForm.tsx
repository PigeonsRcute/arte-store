"use client";

import Image from "next/image";

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  gradient_from: string;
  gradient_to: string;
};

type CategoryFormProps = {
  values: CategoryFormValues;
  mode: "create" | "edit";
  busy: boolean;
  coverPreview: string | null;
  onChange: (name: keyof CategoryFormValues, value: string) => void;
  onCoverSelected: (file: File | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoryForm({
  values,
  mode,
  busy,
  coverPreview,
  onChange,
  onCoverSelected,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    onChange("name", name);
    if (mode === "create") {
      onChange("slug", slugify(name));
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5"
    >
      <h2 className="text-lg font-bold text-orange-700">
        {mode === "edit" ? "Edit Category" : "New Category"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Name *</span>
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={values.name}
            onChange={handleNameChange}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Slug *</span>
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={values.slug}
            onChange={(e) => onChange("slug", slugify(e.target.value))}
            required
          />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-sm font-semibold text-zinc-700">Description</span>
        <textarea
          className="min-h-20 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Gradient From</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-10 cursor-pointer rounded border border-zinc-300"
              value={values.gradient_from}
              onChange={(e) => onChange("gradient_from", e.target.value)}
            />
            <input
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={values.gradient_from}
              onChange={(e) => onChange("gradient_from", e.target.value)}
            />
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Gradient To</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-10 cursor-pointer rounded border border-zinc-300"
              value={values.gradient_to}
              onChange={(e) => onChange("gradient_to", e.target.value)}
            />
            <input
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={values.gradient_to}
              onChange={(e) => onChange("gradient_to", e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Gradient preview */}
      <div
        className="h-10 w-full rounded-lg"
        style={{
          background: `linear-gradient(to right, ${values.gradient_from}, ${values.gradient_to})`,
        }}
      />

      <label className="space-y-1">
        <span className="text-sm font-semibold text-zinc-700">Cover Image</span>
        <input
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          onChange={(e) => onCoverSelected(e.target.files?.[0] ?? null)}
        />
      </label>

      {coverPreview && (
        <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-zinc-200">
          <Image src={coverPreview} alt="Cover preview" fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : mode === "edit" ? "Update" : "Create Category"}
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
