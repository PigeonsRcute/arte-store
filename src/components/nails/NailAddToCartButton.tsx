"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addNailToCart } from "@/lib/cart";

interface Props {
  nailProductId: string;
  stockQty: number;
}

export default function NailAddToCartButton({ nailProductId, stockQty }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const supabase = createClient();

  if (stockQty === 0) {
    return (
      <button
        disabled
        className="w-full rounded-full bg-zinc-200 py-3 font-bold text-zinc-400 cursor-not-allowed"
      >
        Sold Out
      </button>
    );
  }

  async function handleAdd() {
    setStatus("loading");
    const { error } = await addNailToCart(supabase, nailProductId);
    if (error === "not_authenticated") {
      window.location.href = "/login?reason=signin_required&next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    if (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    setStatus("added");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={status === "loading"}
      className="w-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-pink-200 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-300 disabled:opacity-60"
    >
      {status === "loading" && "Adding…"}
      {status === "added" && "Added to cart ✓"}
      {status === "error" && "Something went wrong"}
      {status === "idle" && "Add to Cart"}
    </button>
  );
}
