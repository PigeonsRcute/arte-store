"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CttRate, ShippingService, ShippingSettings } from "@/lib/types";

type RateRow = CttRate & {
  _priceInput: string;
  _saving: boolean;
  _saved: boolean;
};

type Props = {
  initialRates: CttRate[];
  initialSettings: ShippingSettings;
};

function centsToEur(cents: number): string {
  return (cents / 100).toFixed(2);
}

function eurToCents(value: string): number {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function formatWeight(grams: number): string {
  if (grams < 1000) return `0–${grams}g`;
  return `0–${grams / 1000}kg`;
}

function formatWeightTier(rates: RateRow[], index: number): string {
  const prev = index > 0 ? rates[index - 1].max_weight_grams : 0;
  const curr = rates[index].max_weight_grams;
  const lo = prev === 0 ? "0" : `${prev + 1}`;
  if (curr >= 1000) {
    return `${lo}g–${curr / 1000}kg`;
  }
  return `${lo}–${curr}g`;
}

export default function CttRatesManager({ initialRates, initialSettings }: Props) {
  const supabase = createClient();

  const [rates, setRates] = useState<RateRow[]>(
    initialRates.map((r) => ({
      ...r,
      _priceInput: centsToEur(r.price_cents),
      _saving: false,
      _saved: false,
    })),
  );

  const [defaultService, setDefaultService] = useState<ShippingService>(
    initialSettings.default_shipping_service,
  );
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceSaved, setServiceSaved] = useState(false);

  const normalRates = rates
    .filter((r) => r.service === "normal")
    .sort((a, b) => a.max_weight_grams - b.max_weight_grams);

  const expressoRates = rates
    .filter((r) => r.service === "expresso")
    .sort((a, b) => a.max_weight_grams - b.max_weight_grams);

  const updatePrice = (id: string, value: string) => {
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, _priceInput: value, _saved: false } : r)),
    );
  };

  const saveRate = async (rate: RateRow) => {
    setRates((prev) =>
      prev.map((r) => (r.id === rate.id ? { ...r, _saving: true } : r)),
    );
    const price_cents = eurToCents(rate._priceInput);
    const { error } = await supabase
      .from("ctt_rates")
      .update({ price_cents })
      .eq("id", rate.id);

    setRates((prev) =>
      prev.map((r) =>
        r.id === rate.id
          ? { ...r, price_cents, _saving: false, _saved: !error }
          : r,
      ),
    );
  };

  const saveDefaultService = async (service: ShippingService) => {
    setServiceSaving(true);
    setServiceSaved(false);
    const { error } = await supabase
      .from("shipping_settings")
      .update({ default_shipping_service: service })
      .eq("id", "default");
    setServiceSaving(false);
    if (!error) {
      setDefaultService(service);
      setServiceSaved(true);
      setTimeout(() => setServiceSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Default service selector */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5">
        <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-sky-700">
          Default Shipping Service
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Which CTT service is pre-selected for customers at checkout. They can
          always switch to the other option.
        </p>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="default_service"
              value="normal"
              checked={defaultService === "normal"}
              onChange={() => saveDefaultService("normal")}
              disabled={serviceSaving}
              className="accent-sky-500"
            />
            <span className="text-sm font-semibold text-zinc-700">
              Standard (CTT Normal) — 3–5 business days
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="default_service"
              value="expresso"
              checked={defaultService === "expresso"}
              onChange={() => saveDefaultService("expresso")}
              disabled={serviceSaving}
              className="accent-sky-500"
            />
            <span className="text-sm font-semibold text-zinc-700">
              Tracked (CTT Expresso) — 1–2 business days
            </span>
          </label>
          {serviceSaving && (
            <span className="text-xs text-zinc-400">Saving…</span>
          )}
          {serviceSaved && (
            <span className="text-xs font-semibold text-green-600">Saved ✓</span>
          )}
        </div>
      </div>

      {/* CTT Normal rates */}
      <RateTable
        title="Correio Normal (Standard)"
        subtitle="Untracked letter post — 3–5 business days"
        rows={normalRates}
        allRows={rates}
        onPriceChange={updatePrice}
        onSave={saveRate}
      />

      {/* CTT Expresso rates */}
      <RateTable
        title="CTT Expresso (Tracked)"
        subtitle="Tracked parcel service — 1–2 business days"
        rows={expressoRates}
        allRows={rates}
        onPriceChange={updatePrice}
        onSave={saveRate}
      />
    </div>
  );
}

function RateTable({
  title,
  subtitle,
  rows,
  allRows,
  onPriceChange,
  onSave,
}: {
  title: string;
  subtitle: string;
  rows: RateRow[];
  allRows: RateRow[];
  onPriceChange: (id: string, value: string) => void;
  onSave: (rate: RateRow) => void;
}) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-700">
          {title}
        </h2>
        <p className="text-xs text-zinc-400">{subtitle}</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-black uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Weight tier</th>
              <th className="px-4 py-3">Max weight</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((rate, index) => (
              <tr key={rate.id} className="bg-white">
                <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                  {formatWeightTier(rows, index)}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {formatWeight(rate.max_weight_grams)}
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rate._priceInput}
                      onChange={(e) => onPriceChange(rate.id, e.target.value)}
                      className="w-24 rounded-lg border border-zinc-300 bg-white py-1.5 pl-6 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    disabled={rate._saving}
                    onClick={() => onSave(rate)}
                    className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                  >
                    {rate._saving ? "Saving…" : "Save"}
                  </button>
                  {rate._saved && (
                    <span className="ml-2 text-xs font-semibold text-green-600">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
