"use client";

import { motion } from "framer-motion";
import { AnimatedFeatureCard } from "@/components/ui/AnimatedFeatureCard";
import type { SaleEvent } from "@/lib/types";
import { useHoverColor } from "@/lib/use-hover-color";

interface Props {
  headline: string;
  events: SaleEvent[];
  variant?: "nails";
}

type EventDisplay = Pick<SaleEvent, "id" | "name" | "starts_at" | "banner_url" | "discount_type" | "discount_value">;

const PLACEHOLDER_EVENTS: EventDisplay[] = [
  { id: "e1", name: "Open Studio Day",   starts_at: null, banner_url: null, discount_type: "percent", discount_value: 0 },
  { id: "e2", name: "Art Market Pop-Up", starts_at: null, banner_url: null, discount_type: "percent", discount_value: 0 },
];

const EVENT_COLORS = ["purple", "orange", "blue", "purple"] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "Coming Soon";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function discountTag(type: string, value: number): string {
  if (value === 0) return "Event";
  return type === "percent" ? `${value}% off` : `€${value} off`;
}

function EventCard({ event, colorIndex }: { event: EventDisplay; colorIndex: number }) {
  return (
    <AnimatedFeatureCard
      index={formatDate(event.starts_at)}
      tag={discountTag(event.discount_type, event.discount_value)}
      title={event.name}
      imageSrc={event.banner_url ?? "/placeholder-art.svg"}
      color={EVENT_COLORS[colorIndex % 4]}
      className="w-full max-w-none h-[440px]"
    />
  );
}

export default function Events({ headline, events, variant }: Props) {
  const display = events.length > 0 ? events : PLACEHOLDER_EVENTS;
  const { onClick: onHeadlineHover } = useHoverColor();
  const eyebrowClass = variant === "nails"
    ? "mb-2 text-xs font-black uppercase tracking-[0.3em] text-violet-400"
    : "mb-2 text-xs font-black uppercase tracking-[0.3em] text-pink-400";

  return (
    <section className="bg-zinc-950 py-20 px-4">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 px-2">
          <p className={eyebrowClass}>Mark your calendar</p>
          <h2
            className="text-4xl font-black tracking-tight text-white md:text-5xl"
            onClick={onHeadlineHover}
          >
            {headline || "Upcoming Events"}
          </h2>
        </div>

        {/* Row 1: large (8) + small (4) */}
        <div className="mb-4 grid grid-cols-12 gap-4">
          {display[0] && (
            <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-8">
              <EventCard event={display[0]} colorIndex={0} />
            </motion.div>
          )}
          {display[1] && (
            <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-4">
              <EventCard event={display[1]} colorIndex={1} />
            </motion.div>
          )}
        </div>

        {/* Row 2: small (4) + large (8) — only if more events */}
        {display.length > 2 && (
          <div className="grid grid-cols-12 gap-4">
            {display[2] && (
              <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-4">
                <EventCard event={display[2]} colorIndex={2} />
              </motion.div>
            )}
            {display[3] && (
              <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-8">
                <EventCard event={display[3]} colorIndex={3} />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
