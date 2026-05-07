"use client";

import { useState } from "react";
import ShippingAddressForm, { AddressFields } from "@/components/account/ShippingAddressForm";

type Props = {
  profile: {
    full_name: string | null;
    street: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
  fallbackName: string | undefined;
  onCountrySaved?: (country: string) => void;
};

export default function ShippingAddressSection({
  profile,
  fallbackName,
  onCountrySaved,
}: Props) {
  const hasAddress = Boolean(profile?.street);
  const [editing, setEditing] = useState(!hasAddress);
  const [saved, setSaved] = useState(profile);

  const defaultValues: Partial<AddressFields> = {
    fullName: saved?.full_name ?? "",
    street: saved?.street ?? "",
    city: saved?.city ?? "",
    postalCode: saved?.postal_code ?? "",
    country: saved?.country ?? "",
  };

  const handleSaved = (fields: AddressFields) => {
    setSaved({
      full_name: fields.fullName,
      street: fields.street,
      city: fields.city,
      postal_code: fields.postalCode,
      country: fields.country,
    });
    setEditing(false);
    if (fields.country) {
      onCountrySaved?.(fields.country.trim().toUpperCase());
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-50 p-4 ring-2 ring-zinc-100">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
          Shipping to
        </p>
        {saved?.street && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-pink-600 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <ShippingAddressForm defaultValues={defaultValues} onSaved={handleSaved} />
      ) : (
        <div className="text-sm text-zinc-700">
          <p className="font-semibold">{saved?.full_name ?? fallbackName}</p>
          <p>{saved?.street}</p>
          <p>
            {[saved?.city, saved?.postal_code, saved?.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
