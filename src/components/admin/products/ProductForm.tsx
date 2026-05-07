"use client";

import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@/lib/types";

export type ProductFormValues = {
  title: string;
  description: string;
  price: string;
  shippingCost: string;
  categoryIds: string[];
  sku: string;
  stock: string;
  dimensions: string;
  editionSize: string;
  isPublished: boolean;
};

type SortableImageProps = {
  id: string;
  src: string;
  isFirst: boolean;
  onRemove: () => void;
};

function SortableImage({ id, src, isFirst, onRemove }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="group relative aspect-square w-24 cursor-grab overflow-hidden rounded-lg border-2 border-zinc-200 bg-zinc-100 active:cursor-grabbing"
      >
        <Image src={src} alt="Product image" fill className="object-cover" sizes="96px" unoptimized />
        {isFirst && (
          <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[10px] font-bold text-white">
            COVER
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
        aria-label="Remove image"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

type ProductFormProps = {
  values: ProductFormValues;
  mode: "create" | "edit";
  busy: boolean;
  imageItems: { id: string; src: string }[];
  categories: Category[];
  onChange: (name: keyof ProductFormValues, value: string | boolean | string[]) => void;
  onAddImages: (files: FileList | null) => void;
  onRemoveImage: (id: string) => void;
  onReorderImages: (newItems: { id: string; src: string }[]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function ProductForm({
  values,
  mode,
  busy,
  imageItems,
  categories,
  onChange,
  onAddImages,
  onRemoveImage,
  onReorderImages,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = imageItems.findIndex((i) => i.id === active.id);
    const newIndex = imageItems.findIndex((i) => i.id === over.id);
    onReorderImages(arrayMove(imageItems, oldIndex, newIndex));
  };

  const toggleCategory = (id: string) => {
    const next = values.categoryIds.includes(id)
      ? values.categoryIds.filter((c) => c !== id)
      : [...values.categoryIds, id];
    onChange("categoryIds", next);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border border-pink-200 bg-pink-50/40 p-5"
    >
      <h2 className="text-lg font-bold text-pink-700">
        {mode === "edit" ? "Edit Product" : "Add New Product"}
      </h2>

      {/* Name + SKU */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Name *</span>
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={values.title}
            onChange={(e) => onChange("title", e.target.value)}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">SKU *</span>
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={values.sku}
            onChange={(e) => onChange("sku", e.target.value)}
            required
          />
        </label>
      </div>

      {/* Description */}
      <label className="space-y-1">
        <span className="text-sm font-semibold text-zinc-700">Description</span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </label>

      {/* Price / Shipping / Stock */}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Price (USD) *</span>
          <input
            type="number" min="0" step="0.01"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={values.price}
            onChange={(e) => onChange("price", e.target.value)}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Shipping (USD)</span>
          <input
            type="number" min="0" step="0.01"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={values.shippingCost}
            onChange={(e) => onChange("shippingCost", e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Stock *</span>
          <input
            type="number" min="0"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={values.stock}
            onChange={(e) => onChange("stock", e.target.value)}
            required
          />
        </label>
      </div>

      {/* Dimensions / Edition size */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Dimensions</span>
          <input
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="e.g. 30 × 40 cm"
            value={values.dimensions}
            onChange={(e) => onChange("dimensions", e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-zinc-700">Edition size</span>
          <input
            type="number" min="1"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="Blank = open edition"
            value={values.editionSize}
            onChange={(e) => onChange("editionSize", e.target.value)}
          />
        </label>
      </div>

      {/* Categories */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-700">Categories</legend>
        {categories.length === 0 ? (
          <p className="text-xs text-zinc-400">No categories yet — create some in the Categories page.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const checked = values.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    checked
                      ? "border-transparent text-white"
                      : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
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
        )}
      </fieldset>

      {/* Images */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-zinc-700">Images</span>
        <p className="text-xs text-zinc-400">
          Drag to reorder. First image is the cover.
        </p>

        {imageItems.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={imageItems.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-3">
                {imageItems.map((item, index) => (
                  <SortableImage
                    key={item.id}
                    id={item.id}
                    src={item.src}
                    isFirst={index === 0}
                    onRemove={() => onRemoveImage(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-500 transition hover:border-pink-400 hover:text-pink-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {imageItems.length === 0 ? "Upload images" : "Add more images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => onAddImages(e.target.files)}
          />
        </label>
      </div>

      {/* Published */}
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(e) => onChange("isPublished", e.target.checked)}
          className="h-4 w-4 rounded"
        />
        Published
      </label>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-pink-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-pink-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : mode === "edit" ? "Update Product" : "Add Product"}
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
