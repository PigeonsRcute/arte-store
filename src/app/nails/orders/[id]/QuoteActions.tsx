"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { NailCustomOrderStatus } from "@/lib/types";

interface Props {
  orderId: string;
  status: NailCustomOrderStatus;
}

export default function QuoteActions({ orderId, status }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);

  if (status !== "quoted") return null;

  async function handleAction(newStatus: "confirmed" | "cancelled") {
    setLoading(newStatus === "confirmed" ? "confirm" : "cancel");
    await supabase.from("nail_custom_orders").update({ status: newStatus }).eq("id", orderId);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => handleAction("confirmed")}
        disabled={loading !== null}
        className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-8 py-2.5 font-bold text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {loading === "confirm" ? "Confirming…" : "Accept quote"}
      </button>
      <button
        onClick={() => handleAction("cancelled")}
        disabled={loading !== null}
        className="rounded-full border border-zinc-200 px-8 py-2.5 font-semibold text-zinc-600 transition hover:border-zinc-400 disabled:opacity-40"
      >
        {loading === "cancel" ? "Declining…" : "Decline"}
      </button>
    </div>
  );
}
