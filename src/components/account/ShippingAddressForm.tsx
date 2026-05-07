"use client";

import { useState } from "react";

export type AddressFields = {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

type Props = {
  defaultValues?: Partial<AddressFields>;
  onSaved?: (address: AddressFields) => void;
};

const EMPTY: AddressFields = {
  fullName: "",
  street: "",
  city: "",
  postalCode: "",
  country: "",
};

// ISO 3166-1 alpha-2 codes. Value is always the 2-letter code stored in DB
// and matched against shipping_zones.countries[].
const COUNTRIES: { code: string; name: string }[] = [
  { code: "PT", name: "Portugal" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DE", name: "Germany" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "RO", name: "Romania" },
  { code: "SE", name: "Sweden" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IL", name: "Israel" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "NO", name: "Norway" },
  { code: "CH", name: "Switzerland" },
  { code: "IS", name: "Iceland" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "RS", name: "Serbia" },
  { code: "RU", name: "Russia" },
];

export default function ShippingAddressForm({ defaultValues, onSaved }: Props) {
  const [fields, setFields] = useState<AddressFields>({
    ...EMPTY,
    ...defaultValues,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof AddressFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/account/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fields.fullName.trim() || null,
          street: fields.street.trim() || null,
          city: fields.city.trim() || null,
          postal_code: fields.postalCode.trim() || null,
          country: fields.country || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save address.");
      }

      setMessage("Address saved.");
      onSaved?.(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <input
        type="text"
        placeholder="Full Name *"
        required
        value={fields.fullName}
        onChange={(e) => set("fullName", e.target.value)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Street address *"
        required
        value={fields.street}
        onChange={(e) => set("street", e.target.value)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="City *"
          required
          value={fields.city}
          onChange={(e) => set("city", e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Postal code *"
          required
          value={fields.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <select
        required
        value={fields.country}
        onChange={(e) => set("country", e.target.value)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700"
      >
        <option value="">Country *</option>
        {COUNTRIES.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-pink-400 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save Address"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </form>
  );
}
