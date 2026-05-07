"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addToCart } from "@/lib/cart";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  className?: string;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [state, setState] = useState<"idle" | "busy" | "added">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "added") return;
    const id = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(id);
  }, [state]);

  const handleClick = async () => {
    setState("busy");
    setErrorMsg(null);

    const { error } = await addToCart(supabase, productId, quantity);
    if (error === "not_authenticated") {
      router.push("/account?reason=signin_required");
      setState("idle");
      return;
    }
    if (error) {
      setErrorMsg("Could not add to cart. Please try again.");
      setState("idle");
      return;
    }

    setState("added");
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "busy"}
        className={
          className ??
          "w-full rounded-2xl py-3.5 text-base font-black text-white shadow-md transition disabled:opacity-60 " +
            (state === "added"
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600")
        }
      >
        {state === "busy" ? "Adding…" : state === "added" ? "Added to Cart ✓" : "Add to Cart"}
      </button>
      {errorMsg && <p className="text-center text-xs text-red-600">{errorMsg}</p>}
    </div>
  );
}
