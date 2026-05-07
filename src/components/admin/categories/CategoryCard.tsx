"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@/lib/types";

type CategoryCardProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export default function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="10" r="1.5" />
          <circle cx="11" cy="10" r="1.5" />
          <circle cx="5" cy="16" r="1.5" />
          <circle cx="11" cy="16" r="1.5" />
        </svg>
      </button>

      {/* Cover image / gradient swatch */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
        {category.cover_image_url ? (
          <Image
            src={category.cover_image_url}
            alt={category.name}
            fill
            className="object-cover"
            sizes="48px"
            unoptimized
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${category.gradient_from}, ${category.gradient_to})`,
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-zinc-900 truncate">{category.name}</p>
        <p className="text-xs font-mono text-zinc-400">/{category.slug}</p>
        {category.description && (
          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{category.description}</p>
        )}
      </div>

      {/* Gradient pill */}
      <div
        className="hidden h-6 w-20 shrink-0 rounded-full sm:block"
        style={{
          background: `linear-gradient(to right, ${category.gradient_from}, ${category.gradient_to})`,
        }}
        title={`${category.gradient_from} → ${category.gradient_to}`}
      />

      {/* Actions */}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
