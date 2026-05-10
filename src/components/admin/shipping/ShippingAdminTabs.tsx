"use client";

import { useState, type ReactNode } from "react";

type Props = {
  zonesPanel: ReactNode;
  cttPanel: ReactNode;
};

const TABS = [
  { id: "zones", label: "Shipping Zones" },
  { id: "ctt", label: "CTT Rates (Portugal)" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ShippingAdminTabs({ zonesPanel, cttPanel }: Props) {
  const [active, setActive] = useState<TabId>("zones");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${
              active === tab.id
                ? "bg-white text-sky-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div>
        {active === "zones" && zonesPanel}
        {active === "ctt" && cttPanel}
      </div>
    </div>
  );
}
