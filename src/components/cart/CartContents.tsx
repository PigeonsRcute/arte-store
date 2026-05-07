"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateCartQuantity, removeFromCart } from "@/lib/cart";
import type { CartItemWithProduct, SalePrice } from "@/lib/types";

type CartContentsProps = {
  initialItems: CartItemWithProduct[];
  freeShippingThresholdCents: number;
  salePriceMap: Record<string, SalePrice>;
};

function formatEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function CartContents({
  initialItems,
  freeShippingThresholdCents,
  salePriceMap,
}: CartContentsProps) {
  const supabase = createClient();
  const [items, setItems] = useState<CartItemWithProduct[]>(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  const subtotalCents = items.reduce((sum, item) => {
    const p = item.products;
    if (!p) return sum;
    const effectiveCents = salePriceMap[p.id]?.sale_cents ?? p.price_cents;
    return sum + effectiveCents * item.quantity;
  }, 0);

  const total = subtotalCents;

  const threshold = freeShippingThresholdCents;
  const showFreeShippingBar = threshold > 0;
  const freeShippingUnlocked = showFreeShippingBar && subtotalCents >= threshold;
  const progressPct = showFreeShippingBar
    ? Math.min(100, Math.round((subtotalCents / threshold) * 100))
    : 0;
  const amountAwayCents = showFreeShippingBar
    ? Math.max(0, threshold - subtotalCents)
    : 0;

  const handleQuantityChange = async (
    item: CartItemWithProduct,
    delta: number,
  ) => {
    const nextQty = item.quantity + delta;
    setBusyId(item.id);

    if (nextQty < 1) {
      await handleRemove(item);
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: nextQty } : i)),
    );

    const { error } = await updateCartQuantity(supabase, item.id, nextQty);
    if (error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, quantity: item.quantity } : i,
        ),
      );
    }
    setBusyId(null);
  };

  const handleRemove = async (item: CartItemWithProduct) => {
    setBusyId(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await removeFromCart(supabase, item.id);
    setBusyId(null);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-2 ring-yellow-200">
        <p className="text-2xl font-black text-zinc-400">Your canvas is empty.</p>
        <p className="mt-2 text-sm text-zinc-400">
          Time to fill your world with color!
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-2xl bg-yellow-300 px-6 py-3 text-sm font-black text-zinc-900 transition hover:bg-yellow-200"
        >
          Go to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        {items.map((item) => {
          const product = item.products;
          if (!product) return null;
          const heroImage = product.image_urls?.[0] ?? product.image_url;
          const salePrice = salePriceMap[product.id];
          const effectiveCents = salePrice?.sale_cents ?? product.price_cents;
          const subtotal = effectiveCents * item.quantity;
          const isBusy = busyId === item.id;

          return (
            <article
              key={item.id}
              className={`flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-zinc-100 transition ${isBusy ? "opacity-50" : ""}`}
            >
              <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-zinc-100">
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                      No image
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/products/${product.slug}`}
                  className="font-black text-zinc-900 hover:text-pink-600 transition-colors"
                >
                  {product.title}
                </Link>
                {product.category && (
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {product.category}
                  </span>
                )}
                {salePrice ? (
                  <span className="text-sm font-bold text-red-600">
                    ${(salePrice.sale_cents / 100).toFixed(2)}{" "}
                    <span className="text-xs font-normal text-zinc-400 line-through">
                      ${(product.price_cents / 100).toFixed(2)}
                    </span>{" "}
                    each
                  </span>
                ) : (
                  <span className="text-sm font-bold text-pink-700">
                    ${(product.price_cents / 100).toFixed(2)} each
                  </span>
                )}
              </div>

              <div className="flex flex-col items-end justify-between gap-2">
                <div className="flex items-center overflow-hidden rounded-xl border-2 border-zinc-200">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleQuantityChange(item, -1)}
                    className="flex h-8 w-8 items-center justify-center text-base font-black text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] select-none text-center text-sm font-black text-zinc-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isBusy || item.quantity >= product.stock_quantity}
                    onClick={() => handleQuantityChange(item, 1)}
                    className="flex h-8 w-8 items-center justify-center text-base font-black text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <span className="text-base font-black text-zinc-900">
                  ${(subtotal / 100).toFixed(2)}
                </span>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleRemove(item)}
                  className="text-xs font-semibold text-zinc-400 transition hover:text-red-500 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-2 ring-pink-100 lg:col-span-1">
        <h2 className="mb-4 text-lg font-black text-zinc-900">Order Summary</h2>

        <div className="space-y-2 border-b-2 border-zinc-100 pb-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-zinc-600 truncate max-w-[60%]">
                {item.products?.title}
                <span className="text-zinc-400"> ×{item.quantity}</span>
              </span>
              <span className="font-semibold text-zinc-800">
                ${(((salePriceMap[item.products?.id ?? ""]?.sale_cents ?? item.products?.price_cents ?? 0) * item.quantity) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Free shipping progress bar */}
        {showFreeShippingBar && (
          <div className="mt-4 mb-2">
            {freeShippingUnlocked ? (
              <p className="text-sm font-black text-green-600 text-center">
                🎉 You&apos;ve unlocked free shipping!
              </p>
            ) : (
              <p className="text-xs font-semibold text-zinc-500 mb-2">
                {formatEur(amountAwayCents)} away from free shipping
              </p>
            )}
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  freeShippingUnlocked
                    ? "bg-green-400"
                    : "bg-gradient-to-r from-pink-400 to-yellow-400"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-black text-zinc-900">Total</span>
          <span className="text-2xl font-black text-red-600">
            ${(total / 100).toFixed(2)}
          </span>
        </div>

        <Link
          href="/checkout"
          className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 py-3.5 text-center text-base font-black text-white shadow-md transition hover:brightness-110"
        >
          Proceed to Checkout
        </Link>

        <Link
          href="/shop"
          className="mt-4 block text-center text-sm font-semibold text-zinc-500 transition hover:text-pink-600"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}
