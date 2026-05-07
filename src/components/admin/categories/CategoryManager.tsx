"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import CategoryCard from "./CategoryCard";
import CategoryForm, { type CategoryFormValues } from "./CategoryForm";
import FloatingActionMenu from "@/components/ui/FloatingActionMenu";

const IMAGE_BUCKET = "artworks";

const EMPTY_FORM: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  gradient_from: "#6366f1",
  gradient_to: "#ec4899",
};

type CategoryManagerProps = {
  initialCategories: Category[];
};

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [values, setValues] = useState<CategoryFormValues>(EMPTY_FORM);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const openCreate = useCallback(() => {
    setEditingCategory(null);
    setValues(EMPTY_FORM);
    setCoverFile(null);
    setCoverPreview(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setValues({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      gradient_from: category.gradient_from,
      gradient_to: category.gradient_to,
    });
    setCoverFile(null);
    setCoverPreview(category.cover_image_url ?? null);
    setShowForm(true);
  }, []);

  const cancel = useCallback(() => {
    setShowForm(false);
    setEditingCategory(null);
    setValues(EMPTY_FORM);
    setCoverFile(null);
    setCoverPreview(null);
  }, []);

  const handleChange = useCallback((name: keyof CategoryFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCoverSelected = useCallback((file: File | null) => {
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }, []);

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return editingCategory?.cover_image_url ?? null;
    const path = `categories/${Date.now()}-${crypto.randomUUID()}-${coverFile.name}`;
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, coverFile);
    if (error) throw new Error(`Cover upload failed: ${error.message}`);
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!values.name.trim() || !values.slug.trim()) {
      alert("Name and slug are required.");
      return;
    }
    setBusy(true);
    try {
      const coverUrl = await uploadCover();
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description.trim() || null,
        cover_image_url: coverUrl,
        gradient_from: values.gradient_from,
        gradient_to: values.gradient_to,
      };

      if (editingCategory) {
        const { data, error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id)
          .select("*")
          .single();
        if (error) throw error;
        setCategories((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      } else {
        const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), -1);
        const { data, error } = await supabase
          .from("categories")
          .insert({ ...payload, sort_order: maxOrder + 1 })
          .select("*")
          .single();
        if (error) throw error;
        setCategories((prev) => [...prev, data]);
      }

      cancel();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete "${category.name}"? Products in this category will be un-categorized.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    if (editingCategory?.id === category.id) cancel();
    router.refresh();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex).map((c, i) => ({
      ...c,
      sort_order: i,
    }));
    setCategories(reordered);

    // Persist new sort_order values
    await Promise.all(
      reordered.map((c) =>
        supabase.from("categories").update({ sort_order: c.sort_order }).eq("id", c.id)
      )
    );
    router.refresh();
  };

  const fabItems = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      label: "Add Category",
      onClick: openCreate,
    },
  ];

  return (
    <div className="relative space-y-4">
      {/* Slide-in form */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showForm ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CategoryForm
          values={values}
          mode={editingCategory ? "edit" : "create"}
          busy={busy}
          coverPreview={coverPreview}
          onChange={handleChange}
          onCoverSelected={handleCoverSelected}
          onSubmit={handleSubmit}
          onCancel={cancel}
        />
      </div>

      {/* Category list */}
      {categories.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No categories yet. Click + to add the first one.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FloatingActionMenu items={fabItems} />
    </div>
  );
}
