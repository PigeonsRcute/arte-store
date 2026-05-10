"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_CURRENCIES, type Rates } from "@/lib/currency";

type Props = {
  initialRates: Rates;
};

export default function FallbackRatesEditor({ initialRates }: Props) {
  const [rates, setRates] = useState<Rates>(initialRates);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const handleChange = (code: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setRates((prev) => ({ ...prev, [code]: num }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("site_content").upsert(
        { key: "currency_fallback_rates", value: JSON.stringify(rates) },
        { onConflict: "key" },
      );
      setStatus(error ? "error" : "saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Rates are EUR-based (1 EUR = X currency). Used as fallback when the live
          API is unavailable.
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-1.5 font-mono text-xs font-black text-white shadow-[2px_2px_0_#0047FF] transition hover:bg-[#0047FF] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Rates"}
        </button>
      </div>

      {status === "saved" && (
        <p className="font-mono text-xs font-bold text-green-600">Rates saved successfully.</p>
      )}
      {status === "error" && (
        <p className="font-mono text-xs font-bold text-red-600">Failed to save. Check permissions.</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {SUPPORTED_CURRENCIES.map((c) => (
          <div
            key={c.code}
            className="flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#F5F5F0] px-2 py-1.5"
          >
            <span className="text-base leading-none">{c.flag}</span>
            <span className="w-10 shrink-0 font-mono text-xs font-black text-[#1A1A1A]">
              {c.code}
            </span>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={rates[c.code] ?? ""}
              onChange={(e) => handleChange(c.code, e.target.value)}
              className="w-full border border-[#1A1A1A] bg-white px-1.5 py-0.5 font-mono text-xs text-[#1A1A1A] outline-none focus:border-[#0047FF]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
