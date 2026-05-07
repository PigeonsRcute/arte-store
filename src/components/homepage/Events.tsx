"use client";

import { motion } from "framer-motion";
import { AnimatedFeatureCard } from "@/components/ui/AnimatedFeatureCard";
import type { EventsContent, EventItem } from "@/lib/types";
import { useHoverColor } from "@/lib/use-hover-color";

interface Props {
  content: EventsContent;
  variant?: "nails";
}

const PLACEHOLDER_EVENTS: EventItem[] = [
  { id: "e1", name: "Open Studio Day",   date: "Coming Soon", location: "The Studio"  },
  { id: "e2", name: "Art Market Pop-Up", date: "TBA",         location: "City Centre" },
];

// AnimatedFeatureCard only takes "orange" | "purple" | "blue".
// Events use a purple/orange alternating palette for visual contrast with FeaturedProducts.
const EVENT_COLORS = ["purple", "orange", "blue", "purple"] as const;

function EventCard({ event, size, colorIndex }: { event: EventItem; size: "large" | "small"; colorIndex: number }) {
  const card = (
    <AnimatedFeatureCard
      index={event.date}
      tag={event.location}
      title={event.name}
      imageSrc={event.image_url ?? "/placeholder-art.svg"}
      color={EVENT_COLORS[colorIndex % 4]}
      className={`w-full max-w-none ${size === "large" ? "h-[440px]" : "h-[440px]"}`}
    />
  );

  if (event.link) {
    return (
      <a href={event.link} target="_blank" rel="noopener noreferrer" className="block">
        {card}
      </a>
    );
  }
  return <div>{card}</div>;
}

export default function Events({ content, variant }: Props) {
  const { headline, items } = content;
  const events = Array.isArray(items) && items.length > 0 ? items : PLACEHOLDER_EVENTS;
  const { onClick: onHeadlineHover } = useHoverColor();
  const eyebrowClass = variant === "nails"
    ? "mb-2 text-xs font-black uppercase tracking-[0.3em] text-violet-400"
    : "mb-2 text-xs font-black uppercase tracking-[0.3em] text-pink-400";

  return (
    <section className="bg-zinc-950 py-20 px-4">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 px-2">
          <p className={eyebrowClass}>
            Mark your calendar
          </p>
          <h2
            className="text-4xl font-black tracking-tight text-white md:text-5xl"
            onClick={onHeadlineHover}
          >
            {headline || "Upcoming Events"}
          </h2>
        </div>

        {/* Row 1: large (8) + small (4) */}
        <div className="mb-4 grid grid-cols-12 gap-4">
          {events[0] && (
            <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-8">
              <EventCard event={events[0]} size="large" colorIndex={0} />
            </motion.div>
          )}
          {events[1] && (
            <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-4">
              <EventCard event={events[1]} size="small" colorIndex={1} />
            </motion.div>
          )}
        </div>

        {/* Row 2: small (4) + large (8) — only if more events */}
        {events.length > 2 && (
          <div className="grid grid-cols-12 gap-4">
            {events[2] && (
              <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-4">
                <EventCard event={events[2]} size="small" colorIndex={2} />
              </motion.div>
            )}
            {events[3] && (
              <motion.div whileHover={{ scale: 0.98 }} className="col-span-12 md:col-span-8">
                <EventCard event={events[3]} size="large" colorIndex={3} />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
