"use client";

import { useState } from "react";

export default function PayPalButton() {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = async () => {
    setState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/paypal/create-order", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(
          data.error === "cart_empty"
            ? "Your cart is empty."
            : data.error === "insufficient_stock"
              ? "One or more items in your cart is out of stock."
              : "Something went wrong. Please try again.",
        );
        setState("error");
        return;
      }

      window.location.href = data.approvalUrl;
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={state === "loading"}
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FFC439] px-6 py-4 text-base font-black text-[#003087] shadow-md transition hover:brightness-95 disabled:opacity-60"
      >
        {state === "loading" ? (
          <span className="animate-pulse">Redirecting to PayPal…</span>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-[#003087]"
              aria-hidden="true"
            >
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
            </svg>
            Pay with PayPal
          </>
        )}
      </button>
      {errorMsg && (
        <p className="text-center text-sm font-semibold text-red-600">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
