"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Product, Category, ProductCategory } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import ProductForm, { type ProductFormValues } from "./ProductForm";
import ProductGrid from "./ProductGrid";
import FloatingActionMenu from "@/components/ui/FloatingActionMenu";
import ActionSearchBar from "@/components/ui/ActionSearchBar";

const IMAGE_BUCKET = "artworks";

type ImageItem = { id: string; src: string; file?: File };

const EMPTY_FORM: ProductFormValues = {
  title: "",
  description: "",
  price: "",
  shippingCost: "0",
  categoryIds: [],
  sku: "",
  stock: "",
  dimensions: "",
  editionSize: "",
  weightGrams: "",
  isPublished: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ProductManagerProps = {
  initialProducts: Product[];
  categories: Category[];
  initialProductCategories: ProductCategory[];
};

export default function ProductManager({
  initialProducts,
  categories,
  initialProductCategories,
}: ProductManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const pc of initialProductCategories) {
      if (!map[pc.product_id]) map[pc.product_id] = [];
      map[pc.product_id].push(pc.category_id);
    }
    return map;
  });

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [values, setValues] = useState<ProductFormValues>(EMPTY_FORM);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  // ------ Search filtering ------
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  // ------ Form helpers ------
  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingProduct(null);
    setValues(EMPTY_FORM);
    setImageItems([]);
  }, []);

  const handleChange = useCallback(
    (name: keyof ProductFormValues, value: string | boolean | string[]) => {
      setValues((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleAddImages = useCallback((files: FileList | null) => {
    if (!files) return;
    const newItems: ImageItem[] = Array.from(files).map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      src: URL.createObjectURL(file),
      file,
    }));
    setImageItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImageItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleReorderImages = useCallback((newItems: ImageItem[]) => {
    setImageItems(newItems);
  }, []);

  // ------ Upload only new files, keep existing URLs in order ------
  const uploadImages = async (): Promise<string[]> => {
    const result: string[] = [];
    for (const item of imageItems) {
      if (item.file) {
        const path = `${Date.now()}-${crypto.randomUUID()}-${item.file.name}`;
        const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, item.file);
        if (error) throw new Error(`Image upload failed: ${error.message}`);
        const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
        result.push(data.publicUrl);
      } else {
        // Existing URL — preserve as-is
        result.push(item.src);
      }
    }
    return result;
  };

  // ------ Submit ------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!values.title.trim() || !values.sku.trim() || !values.price || !values.stock) {
      alert("Please fill all required fields: Name, SKU, Price, Stock.");
      return;
    }
    setBusy(true);
    try {
      const imageUrls = await uploadImages();
      const primaryCategory = values.categoryIds[0]
        ? categories.find((c) => c.id === values.categoryIds[0])?.name ?? null
        : null;

      const payload = {
        title: values.title.trim(),
        slug: editingProduct?.slug ?? `${slugify(values.title)}-${Date.now().toString().slice(-6)}`,
        description: values.description.trim() || null,
        price_cents: Math.round(Number(values.price) * 100),
        shipping_cost_cents: Math.round(Number(values.shippingCost) * 100),
        category: primaryCategory,
        sku: values.sku.trim(),
        stock_quantity: Number(values.stock),
        dimensions: values.dimensions.trim() || null,
        edition_size: values.editionSize ? Number(values.editionSize) : null,
        weight_grams: values.weightGrams ? Number(values.weightGrams) : null,
        image_url: imageUrls[0] ?? null,
        image_urls: imageUrls,
        is_published: values.isPublished,
      };

      let savedProduct: Product;
      if (editingProduct) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id)
          .select("*")
          .single();
        if (error) throw error;
        savedProduct = data;
        setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("*")
          .single();
        if (error) throw error;
        savedProduct = data;
        setProducts((prev) => [savedProduct, ...prev]);
      }

      // Sync product_categories junction table
      await supabase.from("product_categories").delete().eq("product_id", savedProduct.id);
      if (values.categoryIds.length > 0) {
        await supabase.from("product_categories").insert(
          values.categoryIds.map((catId) => ({
            product_id: savedProduct.id,
            category_id: catId,
          }))
        );
      }
      setProductCategoryMap((prev) => ({
        ...prev,
        [savedProduct.id]: values.categoryIds,
      }));

      resetForm();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unexpected error saving product.");
    } finally {
      setBusy(false);
    }
  };

  // ------ Edit ------
  const startEdit = useCallback(
    (product: Product) => {
      setEditingProduct(product);
      const catIds = productCategoryMap[product.id] ?? [];
      setValues({
        title: product.title,
        description: product.description ?? "",
        price: (product.price_cents / 100).toFixed(2),
        shippingCost: (product.shipping_cost_cents / 100).toFixed(2),
        categoryIds: catIds,
        sku: product.sku ?? "",
        stock: String(product.stock_quantity),
        dimensions: product.dimensions ?? "",
        editionSize: product.edition_size != null ? String(product.edition_size) : "",
        weightGrams: product.weight_grams != null ? String(product.weight_grams) : "",
        isPublished: product.is_published,
      });
      // Existing image URLs as ImageItems (no file attached = existing)
      setImageItems(
        (product.image_urls ?? []).map((src) => ({
          id: `existing-${src}`,
          src,
        }))
      );
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [productCategoryMap]
  );

  // ------ Delete ------
  const deleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    if (editingProduct?.id === product.id) resetForm();
    router.refresh();
  };

  // ------ FAB items ------
  const fabItems = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      label: "Add Product",
      onClick: () => {
        setEditingProduct(null);
        setValues(EMPTY_FORM);
        setImageItems([]);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 6h16M4 10h16M4 14h10" />
        </svg>
      ),
      label: "Manage Categories",
      onClick: () => { window.location.href = "/admin/categories"; },
    },
  ];

  return (
    <div className="relative space-y-5">
      {/* Slide-in form */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showForm ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ProductForm
          values={values}
          mode={editingProduct ? "edit" : "create"}
          busy={busy}
          imageItems={imageItems}
          categories={categories}
          onChange={handleChange}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
          onReorderImages={handleReorderImages}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      </div>

      {/* Search bar */}
      <ActionSearchBar
        placeholder="Search products by name, SKU…"
        value={search}
        onChange={setSearch}
      />

      {/* Product grid */}
      <ProductGrid
        products={filteredProducts}
        categories={categories}
        productCategoryMap={productCategoryMap}
        onEdit={startEdit}
        onDelete={deleteProduct}
      />

      <FloatingActionMenu items={fabItems} />
    </div>
  );
}
