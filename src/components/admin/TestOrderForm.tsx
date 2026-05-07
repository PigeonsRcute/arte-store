"use client";

import { useState, useTransition } from "react";
import { createTestOrder } from "@/app/admin/orders/test-order/actions";

interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface ProductOption {
  id: string;
  title: string;
  price_cents: number;
}

interface Props {
  customers: Customer[];
  products: ProductOption[];
}

interface LineItem {
  productId: string;
  quantity: number;
}

export default function TestOrderForm({ customers, products }: Props) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1 }]);
  const [shippingName, setShippingName] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [status, setStatus] = useState("paid");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    const c = customers.find((c) => c.id === id);
    if (c) {
      setShippingName(c.full_name ?? "");
      setShippingStreet(c.street ?? "");
      setShippingCity(c.city ?? "");
      setShippingPostalCode(c.postal_code ?? "");
      setShippingCountry(c.country ?? "");
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  const validItems = items.filter((i) => i.productId && i.quantity > 0);
  const subtotalCents = validItems.reduce((sum, i) => {
    const p = products.find((p) => p.id === i.productId);
    return sum + (p?.price_cents ?? 0) * i.quantity;
  }, 0);
  const canSubmit = customerId && validItems.length > 0 && !isPending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("customer_id", customerId);
    fd.set("status", status);
    fd.set("shipping_name", shippingName);
    fd.set("shipping_street", shippingStreet);
    fd.set("shipping_city", shippingCity);
    fd.set("shipping_postal_code", shippingPostalCode);
    fd.set("shipping_country", shippingCountry);
    fd.set("items", JSON.stringify(validItems));
    startTransition(async () => {
      try {
        await createTestOrder(fd);
      } catch (err: unknown) {
        // Re-throw Next.js redirect errors; catch everything else
        if (err && typeof err === "object" && "digest" in err) throw err;
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Customer */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Customer
        </label>
        <select
          value={customerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          required
          className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 focus:border-green-400 focus:outline-none"
        >
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name ?? "No name"}{c.email ? ` (${c.email})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Products
          </label>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-bold text-green-600 hover:text-green-800"
          >
            + Add row
          </button>
        </div>
        {items.map((item, i) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <div key={i} className="flex items-center gap-3">
              <select
                value={item.productId}
                onChange={(e) => updateItem(i, "productId", e.target.value)}
                className="flex-1 rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-sm text-zinc-700 focus:border-green-400 focus:outline-none"
              >
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — ${(p.price_cents / 100).toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  updateItem(i, "quantity", parseInt(e.target.value, 10) || 1)
                }
                className="w-20 rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-center text-sm font-bold text-zinc-700 focus:border-green-400 focus:outline-none"
              />
              {product && (
                <span className="w-20 text-right text-xs text-zinc-400">
                  ${((product.price_cents * item.quantity) / 100).toFixed(2)}
                </span>
              )}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-lg font-bold leading-none text-zinc-300 hover:text-red-500"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {validItems.length > 0 && (
          <p className="text-right text-sm font-bold text-zinc-500">
            Subtotal: ${(subtotalCents / 100).toFixed(2)}
            <span className="ml-1 text-xs font-normal text-zinc-400">
              + shipping calculated from country
            </span>
          </p>
        )}
      </div>

      {/* Shipping address */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Shipping Address
        </label>
        <input
          value={shippingName}
          onChange={(e) => setShippingName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-300 focus:border-green-400 focus:outline-none"
        />
        <input
          value={shippingStreet}
          onChange={(e) => setShippingStreet(e.target.value)}
          placeholder="Street address"
          className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-300 focus:border-green-400 focus:outline-none"
        />
        <div className="grid grid-cols-3 gap-3">
          <input
            value={shippingCity}
            onChange={(e) => setShippingCity(e.target.value)}
            placeholder="City"
            className="rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-300 focus:border-green-400 focus:outline-none"
          />
          <input
            value={shippingPostalCode}
            onChange={(e) => setShippingPostalCode(e.target.value)}
            placeholder="Postal code"
            className="rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-300 focus:border-green-400 focus:outline-none"
          />
          <input
            value={shippingCountry}
            onChange={(e) => setShippingCountry(e.target.value.toUpperCase())}
            placeholder="Country (PT, US…)"
            maxLength={2}
            className="rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-mono text-zinc-700 placeholder:text-zinc-300 focus:border-green-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Order Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 focus:border-green-400 focus:outline-none"
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-xl bg-green-500 px-6 py-3 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Creating…" : "Create Test Order"}
      </button>
    </form>
  );
}
