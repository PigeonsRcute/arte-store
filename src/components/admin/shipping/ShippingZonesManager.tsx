"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ShippingZone, ShippingSettings } from "@/lib/types";

type ZoneRow = ShippingZone & {
  _flatInput: string;
  _weightInput: string;
  _countriesInput: string;
  _saving: boolean;
  _saved: boolean;
};

type Props = {
  initialZones: ShippingZone[];
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

function parseCountries(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export default function ShippingZonesManager({
  initialZones,
  initialSettings,
}: Props) {
  const supabase = createClient();

  const [zones, setZones] = useState<ZoneRow[]>(
    initialZones.map((z) => ({
      ...z,
      _flatInput: centsToEur(z.flat_rate_cents),
      _weightInput: centsToEur(z.weight_rate_cents_per_kg),
      _countriesInput: z.countries.join(", "),
      _saving: false,
      _saved: false,
    })),
  );

  const [thresholdInput, setThresholdInput] = useState(
    centsToEur(initialSettings.global_free_shipping_threshold_cents),
  );
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  const isRestOfWorld = (z: ZoneRow) => z.countries.length === 0;

  const updateZoneField = (
    id: string,
    field: keyof ZoneRow,
    value: string,
  ) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === id ? { ...z, [field]: value, _saved: false } : z,
      ),
    );
  };

  const saveZone = async (zone: ZoneRow) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zone.id ? { ...z, _saving: true } : z)),
    );

    const flat_rate_cents = eurToCents(zone._flatInput);
    const weight_rate_cents_per_kg = eurToCents(zone._weightInput);
    const countries = isRestOfWorld(zone)
      ? []
      : parseCountries(zone._countriesInput);

    const { error } = await supabase
      .from("shipping_zones")
      .update({ flat_rate_cents, weight_rate_cents_per_kg, countries })
      .eq("id", zone.id);

    setZones((prev) =>
      prev.map((z) =>
        z.id === zone.id
          ? {
              ...z,
              flat_rate_cents,
              weight_rate_cents_per_kg,
              countries,
              _saving: false,
              _saved: !error,
            }
          : z,
      ),
    );
  };

  const saveThreshold = async () => {
    setThresholdSaving(true);
    setThresholdError(null);
    const cents = eurToCents(thresholdInput);

    const { error } = await supabase
      .from("shipping_settings")
      .update({ global_free_shipping_threshold_cents: cents })
      .eq("id", "default");

    setThresholdSaving(false);
    if (error) {
      setThresholdError(error.message);
    } else {
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Global free shipping threshold */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5">
        <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-sky-700">
          Global Free Shipping Threshold
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Orders at or above this amount get free shipping. Set to{" "}
          <strong>€0.00</strong> to disable. Each event can override this with
          its own threshold.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
              €
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={thresholdInput}
              onChange={(e) => {
                setThresholdInput(e.target.value);
                setThresholdSaved(false);
              }}
              className="w-36 rounded-lg border border-zinc-300 bg-white py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <button
            type="button"
            disabled={thresholdSaving}
            onClick={saveThreshold}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            {thresholdSaving ? "Saving…" : "Save"}
          </button>
          {thresholdSaved && (
            <span className="text-sm font-semibold text-green-600">Saved ✓</span>
          )}
          {thresholdError && (
            <span className="text-sm text-red-600">{thresholdError}</span>
          )}
        </div>
      </div>

      {/* Zones table */}
      <div>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-600">
          Shipping Zones
        </h2>

        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-black uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Countries (ISO codes)</th>
                <th className="px-4 py-3">Flat Rate</th>
                <th className="px-4 py-3">Weight Rate /kg</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {zones.map((zone) => (
                <tr key={zone.id} className="bg-white">
                  <td className="px-4 py-3 font-semibold text-zinc-800 whitespace-nowrap">
                    {zone.name}
                  </td>

                  <td className="px-4 py-3">
                    {isRestOfWorld(zone) ? (
                      <span className="text-xs text-zinc-400 italic">
                        All other countries
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={zone._countriesInput}
                        onChange={(e) =>
                          updateZoneField(
                            zone.id,
                            "_countriesInput",
                            e.target.value,
                          )
                        }
                        placeholder="PT, ES, FR, …"
                        className="w-full min-w-[180px] rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    )}
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
                        value={zone._flatInput}
                        onChange={(e) =>
                          updateZoneField(zone.id, "_flatInput", e.target.value)
                        }
                        className="w-24 rounded-lg border border-zinc-300 bg-white py-1.5 pl-6 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
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
                        value={zone._weightInput}
                        onChange={(e) =>
                          updateZoneField(
                            zone.id,
                            "_weightInput",
                            e.target.value,
                          )
                        }
                        className="w-24 rounded-lg border border-zinc-300 bg-white py-1.5 pl-6 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={zone._saving}
                      onClick={() => saveZone(zone)}
                      className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                    >
                      {zone._saving ? "Saving…" : "Save"}
                    </button>
                    {zone._saved && (
                      <span className="ml-2 text-xs font-semibold text-green-600">
                        ✓
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          Countries use ISO 3166-1 alpha-2 codes (e.g.{" "}
          <strong>PT</strong>, <strong>US</strong>, <strong>GB</strong>). The
          &quot;Rest of World&quot; zone is the catch-all for any country not
          listed above it.
        </p>
      </div>

      {/* Weight reference */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-zinc-500">
          Category Default Weights
        </h2>
        <p className="mb-2 text-xs text-zinc-400">
          Applied when a product has no explicit weight set. You can override per product in the Products admin.
        </p>
        <div className="grid grid-cols-2 gap-1 text-xs text-zinc-600 sm:grid-cols-5">
          <span>Stickers — 50g</span>
          <span>Prints — 200g</span>
          <span>Supagaes — 200g</span>
          <span>Keychains — 100g</span>
          <span>Pins — 80g</span>
          <span className="sm:col-span-5 text-zinc-400">All other categories — 150g (default)</span>
        </div>
      </div>
    </div>
  );
}
