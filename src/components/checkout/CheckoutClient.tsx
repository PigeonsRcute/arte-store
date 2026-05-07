"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PayPalButton from "@/components/checkout/PayPalButton";
import ShippingAddressSection from "@/components/checkout/ShippingAddressSection";
import type { ShippingEstimateResponse } from "@/app/api/shipping-estimate/route";

type CartItemForCheckout = {
  id: string;
  quantity: number;
  product: {
    title: string;
    slug: string;
    price_cents: number;
    sale_price_cents?: number;
    image_url: string | null;
    image_urls: string[];
  };
};

type ProfileForCheckout = {
  full_name: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
} | null;

type Props = {
  items: CartItemForCheckout[];
  profile: ProfileForCheckout;
  email: string | undefined;
  subtotalCents: number;
  initialShipping: ShippingEstimateResponse;
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function CheckoutClient({
  items,
  profile,
  email,
  subtotalCents,
  initialShipping,
}: Props) {
  const [shipping, setShipping] =
    useState<ShippingEstimateResponse>(initialShipping);
  const [fetchingShipping, setFetchingShipping] = useState(false);

  const totalCents = subtotalCents + shipping.shippingCents;

  const handleCountrySaved = async (country: string) => {
    setFetchingShipping(true);
    try {
      const res = await fetch(
        `/api/shipping-estimate?country=${encodeURIComponent(country)}`,
      );
      if (res.ok) {
        const data: ShippingEstimateResponse = await res.json();
        setShipping(data);
      }
    } finally {
      setFetchingShipping(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Left — order summary */}
      <div className="flex flex-col gap-4 lg:col-span-3">
        <h2 className="text-lg font-black text-zinc-700">Order Summary</h2>

        {items.map((item) => {
          const heroImage =
            item.product.image_urls?.[0] ?? item.product.image_url;
          return (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-zinc-100"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="font-black text-zinc-900">{item.product.title}</p>
                  <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                </div>
                {item.product.sale_price_cents ? (
                  <span className="text-sm font-semibold text-red-600">
                    {formatPrice(item.product.sale_price_cents * item.quantity)}{" "}
                    <span className="text-xs font-normal text-zinc-400 line-through">
                      {formatPrice(item.product.price_cents * item.quantity)}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-zinc-800">
                    {formatPrice(item.product.price_cents * item.quantity)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Shipping address */}
        <ShippingAddressSection
          profile={profile}
          fallbackName={email}
          onCountrySaved={handleCountrySaved}
        />
      </div>

      {/* Right — totals + pay button */}
      <div className="h-fit lg:col-span-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-pink-100">
          <h2 className="mb-4 text-lg font-black text-zinc-900">Payment</h2>

          <div className="space-y-2 border-b-2 border-zinc-100 pb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotalCents)}</span>
            </div>

            {/* Shipping row — reactive */}
            <div className="flex justify-between">
              <span className="text-zinc-600">
                {shipping.zoneName
                  ? `Shipping to ${shipping.zoneName}`
                  : "Shipping"}
                {fetchingShipping && (
                  <span className="ml-1 text-zinc-400">…</span>
                )}
              </span>
              <span className="font-semibold">
                {fetchingShipping ? (
                  <span className="text-zinc-400">—</span>
                ) : shipping.isFree ? (
                  <span className="text-green-600">Free 🎉</span>
                ) : shipping.zoneName === null && !profile?.country ? (
                  <span className="text-zinc-400 text-xs">
                    Add address to calculate
                  </span>
                ) : (
                  formatEur(shipping.shippingCents)
                )}
              </span>
            </div>

            {/* "Away from free shipping" nudge */}
            {!fetchingShipping &&
              !shipping.isFree &&
              shipping.freeThresholdCents > 0 &&
              shipping.amountAwayFromFreeCents > 0 && (
                <p className="text-xs text-pink-600 font-semibold pt-1">
                  You&apos;re {formatEur(shipping.amountAwayFromFreeCents)} away
                  from free shipping
                </p>
              )}
          </div>

          <div className="mt-4 mb-6 flex items-center justify-between">
            <span className="text-base font-black text-zinc-900">Total</span>
            <span className="text-2xl font-black text-red-600">
              {formatPrice(totalCents)}
            </span>
          </div>

          <PayPalButton />

          <p className="mt-3 text-center text-xs text-zinc-400">
            You will be redirected to PayPal to complete payment securely.
          </p>
        </div>
      </div>
    </div>
  );
}
