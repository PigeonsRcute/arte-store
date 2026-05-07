"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SaleEvent, EventStatus, Category, EventProduct, EventCategory } from "@/lib/types";
import EventCard from "./EventCard";
import EventForm, { type EventFormValues, type ProductOption } from "./EventForm";
import FloatingActionMenu from "@/components/ui/FloatingActionMenu";

const IMAGE_BUCKET = "artworks";

const EMPTY_FORM: EventFormValues = {
  name: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  free_shipping_threshold: "",
  scope: "categories",
  category_ids: [],
  product_ids: [],
  launch_mode: "immediate",
  starts_at: "",
  ends_at: "",
};

type EventManagerProps = {
  initialEvents: SaleEvent[];
  categories: Pick<Category, "id" | "name" | "slug" | "gradient_from" | "gradient_to" | "sort_order">[];
  products: ProductOption[];
  initialEventProducts: EventProduct[];
  initialEventCategories: EventCategory[];
};

export default function EventManager({
  initialEvents,
  categories,
  products,
  initialEventProducts,
  initialEventCategories,
}: EventManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [events, setEvents] = useState<SaleEvent[]>(initialEvents);
  const [eventProductMap, setEventProductMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const ep of initialEventProducts) {
      if (!map[ep.event_id]) map[ep.event_id] = [];
      map[ep.event_id].push(ep.product_id);
    }
    return map;
  });
  const [eventCategoryMap, setEventCategoryMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const ec of initialEventCategories) {
      if (!map[ec.event_id]) map[ec.event_id] = [];
      map[ec.event_id].push(ec.category_id);
    }
    return map;
  });

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SaleEvent | null>(null);
  const [values, setValues] = useState<EventFormValues>(EMPTY_FORM);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const cancel = useCallback(() => {
    setShowForm(false);
    setEditingEvent(null);
    setValues(EMPTY_FORM);
    setBannerFile(null);
    setBannerPreview(null);
    setProductSearch("");
  }, []);

  const openCreate = useCallback(() => {
    setEditingEvent(null);
    setValues(EMPTY_FORM);
    setBannerFile(null);
    setBannerPreview(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openEdit = useCallback((event: SaleEvent) => {
    setEditingEvent(event);
    setValues({
      name: event.name,
      description: event.description ?? "",
      discount_type: event.discount_type,
      discount_value: String(event.discount_value),
      scope: (() => {
        const hasCats = (eventCategoryMap[event.id]?.length ?? 0) > 0;
        const hasProd = (eventProductMap[event.id]?.length ?? 0) > 0;
        if (hasCats && hasProd) return "both";
        if (hasProd) return "products";
        return "categories";
      })(),
      category_ids: eventCategoryMap[event.id] ?? [],
      product_ids: eventProductMap[event.id] ?? [],
      free_shipping_threshold:
        event.free_shipping_threshold_cents != null
          ? (event.free_shipping_threshold_cents / 100).toFixed(2)
          : "",
      launch_mode: event.starts_at ? "scheduled" : "immediate",
      starts_at: event.starts_at ? event.starts_at.slice(0, 16) : "",
      ends_at: event.ends_at ? event.ends_at.slice(0, 16) : "",
    });
    setBannerFile(null);
    setBannerPreview(event.banner_url ?? null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [eventCategoryMap, eventProductMap]);

  const handleChange = useCallback(
    (name: keyof EventFormValues, value: EventFormValues[keyof EventFormValues]) => {
      setValues((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleBannerSelected = useCallback((file: File | null) => {
    setBannerFile(file);
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  }, []);

  const uploadBanner = async (): Promise<string | null> => {
    if (!bannerFile) return editingEvent?.banner_url ?? null;
    const path = `events/${Date.now()}-${crypto.randomUUID()}-${bannerFile.name}`;
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bannerFile);
    if (error) throw new Error(`Banner upload failed: ${error.message}`);
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!values.name.trim() || !values.discount_value) {
      alert("Name and discount value are required.");
      return;
    }
    setBusy(true);
    try {
      const bannerUrl = await uploadBanner();

      const isImmediate = values.launch_mode === "immediate";
      const startsAt = isImmediate ? null : values.starts_at || null;
      const status: EventStatus = isImmediate
        ? "live"
        : values.starts_at
        ? "scheduled"
        : "draft";

      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        banner_url: bannerUrl,
        discount_type: values.discount_type,
        discount_value: Number(values.discount_value),
        free_shipping_threshold_cents: values.free_shipping_threshold
          ? Math.round(parseFloat(values.free_shipping_threshold) * 100)
          : null,
        status,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
      };

      let savedEvent: SaleEvent;
      if (editingEvent) {
        const { data, error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editingEvent.id)
          .select("*")
          .single();
        if (error) throw error;
        savedEvent = data;
        setEvents((prev) => prev.map((ev) => (ev.id === savedEvent.id ? savedEvent : ev)));
      } else {
        const { data, error } = await supabase.from("events").insert(payload).select("*").single();
        if (error) throw error;
        savedEvent = data;
        setEvents((prev) => [savedEvent, ...prev]);
      }

      // Sync event_categories
      await supabase.from("event_categories").delete().eq("event_id", savedEvent.id);
      if (values.category_ids.length > 0 && values.scope !== "products") {
        await supabase.from("event_categories").insert(
          values.category_ids.map((catId) => ({
            event_id: savedEvent.id,
            category_id: catId,
            discount_value: null,
          }))
        );
      }

      // Sync event_products
      await supabase.from("event_products").delete().eq("event_id", savedEvent.id);
      if (values.product_ids.length > 0 && values.scope !== "categories") {
        await supabase.from("event_products").insert(
          values.product_ids.map((prodId) => ({
            event_id: savedEvent.id,
            product_id: prodId,
            discount_value: null,
          }))
        );
      }

      setEventCategoryMap((prev) => ({
        ...prev,
        [savedEvent.id]: values.scope === "products" ? [] : values.category_ids,
      }));
      setEventProductMap((prev) => ({
        ...prev,
        [savedEvent.id]: values.scope === "categories" ? [] : values.product_ids,
      }));

      cancel();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (event: SaleEvent, newStatus: EventStatus) => {
    const { data, error } = await supabase
      .from("events")
      .update({ status: newStatus })
      .eq("id", event.id)
      .select("*")
      .single();
    if (error) { alert(`Status update failed: ${error.message}`); return; }
    setEvents((prev) => prev.map((ev) => (ev.id === data.id ? data : ev)));
    router.refresh();
  };

  const handleDelete = async (event: SaleEvent) => {
    if (!confirm(`Delete event "${event.name}"?`)) return;
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    setEvents((prev) => prev.filter((ev) => ev.id !== event.id));
    if (editingEvent?.id === event.id) cancel();
    router.refresh();
  };

  const fabItems = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      label: "New Event",
      onClick: openCreate,
    },
  ];

  return (
    <div className="relative space-y-5">
      {/* Slide-in form */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showForm ? "max-h-[2400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <EventForm
          values={values}
          mode={editingEvent ? "edit" : "create"}
          busy={busy}
          bannerPreview={bannerPreview}
          categories={categories}
          products={products}
          productSearch={productSearch}
          onProductSearchChange={setProductSearch}
          onChange={handleChange}
          onBannerSelected={handleBannerSelected}
          onSubmit={handleSubmit}
          onCancel={cancel}
        />
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          No events yet. Click + to create one.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <FloatingActionMenu items={fabItems} />
    </div>
  );
}
