"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PALETTES } from "@/lib/palettes";
import { createClient } from "@/lib/supabase/client";

// ── Stage definitions ────────────────────────────────────────────────────────

const STAGES = [
  {
    key: "order_placed",
    label: "Order Placed",
    slugs: ["order_placed", "pending", "paid"],
  },
  {
    key: "processing",
    label: "Processing",
    slugs: ["processing", "preparing"],
  },
  {
    key: "shipped",
    label: "Shipped",
    slugs: ["shipped", "in_transit", "dispatched"],
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    slugs: ["out_for_delivery", "with_courier"],
  },
  {
    key: "delivered",
    label: "Delivered",
    slugs: ["delivered", "fulfilled", "completed"],
  },
];

// Vehicle bounding box in px (w-14 h-14)
const VEHICLE_PX = 56;

function resolveStageIndex(steps: { status: string }[]): number {
  let highest = 0;
  for (const step of steps) {
    const idx = STAGES.findIndex((s) =>
      s.slugs.includes(step.status.toLowerCase()),
    );
    if (idx !== -1 && idx > highest) highest = idx;
  }
  return highest;
}

// ── CSS keyframes for scrolling road texture ─────────────────────────────────
// Injected via <style> so we don't touch globals.css for a single component.

const ROAD_CSS = `
@keyframes roadScrollH {
  from { background-position: 0 0; }
  to   { background-position: -40px 0; }
}
@keyframes roadScrollV {
  from { background-position: 0 0; }
  to   { background-position: 0 -40px; }
}
.road-moving-h { animation: roadScrollH 0.45s linear infinite; }
.road-moving-v { animation: roadScrollV 0.45s linear infinite; }
`;

// ── Celebration burst (same palette as click-explosion) ──────────────────────

function CelebrationBurst() {
  // useState so the palette is fixed on mount and doesn't re-randomise on re-render
  const [palette] = useState(
    () => PALETTES[Math.floor(Math.random() * PALETTES.length)],
  );

  const particles = Array.from({ length: 22 }, (_, i) => {
    const angle = (360 / 22) * i + (Math.random() * 16 - 8);
    const dist = 38 + Math.random() * 46;
    const rad = (angle * Math.PI) / 180;
    return {
      id: i,
      color: palette[i % palette.length],
      x: Math.cos(rad) * dist,
      y: Math.sin(rad) * dist,
      size: 5 + Math.random() * 7,
      delay: i * 0.018,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
          transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
        />
      ))}
    </div>
  );
}

// ── Vehicle placeholders ─────────────────────────────────────────────────────
// Each function has a prominent TODO block marking the exact swap point.
// Replace the emoji span with a <video> tag pointing to your WebM file.

function VehicleOrderPlaced() {
  /*
   * ============================================
   * TODO: REPLACE WITH CUSTOM 2D ANIMATION
   * Swap this emoji/SVG with:
   * <video autoPlay loop muted playsInline className="w-14 h-14">
   *   <source src="/animations/order-placed.webm" type="video/webm" />
   * </video>
   * ============================================
   */
  return (
    <motion.span
      role="img"
      aria-label="Package"
      className="block select-none text-3xl leading-none"
      animate={{ rotate: [-5, 5, -5] }}
      transition={{ repeat: Infinity, duration: 0.65, ease: "easeInOut" }}
    >
      📦
    </motion.span>
  );
}

function VehicleProcessing() {
  /*
   * ============================================
   * TODO: REPLACE WITH CUSTOM 2D ANIMATION
   * Swap this emoji/SVG with:
   * <video autoPlay loop muted playsInline className="w-14 h-14">
   *   <source src="/animations/processing.webm" type="video/webm" />
   * </video>
   * ============================================
   */
  return (
    <motion.span
      role="img"
      aria-label="Forklift / warehouse"
      className="block select-none text-3xl leading-none"
      animate={{ x: [-3, 3, -3] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
    >
      🏭
    </motion.span>
  );
}

function VehicleShipped({ bobbing }: { bobbing: boolean }) {
  /*
   * ============================================
   * TODO: REPLACE WITH CUSTOM 2D ANIMATION
   * Swap this emoji/SVG with:
   * <video autoPlay loop muted playsInline className="w-14 h-14">
   *   <source src="/animations/shipped.webm" type="video/webm" />
   * </video>
   * ============================================
   */
  return (
    <motion.span
      role="img"
      aria-label="Delivery truck"
      className="block select-none text-3xl leading-none"
      animate={{ y: bobbing ? [0, -5, 0] : 0 }}
      transition={{
        repeat: bobbing ? Infinity : 0,
        duration: 0.5,
        ease: "easeInOut",
      }}
    >
      🚚
    </motion.span>
  );
}

function VehicleOutForDelivery({ bobbing }: { bobbing: boolean }) {
  /*
   * ============================================
   * TODO: REPLACE WITH CUSTOM 2D ANIMATION
   * Swap this emoji/SVG with:
   * <video autoPlay loop muted playsInline className="w-14 h-14">
   *   <source src="/animations/out-for-delivery.webm" type="video/webm" />
   * </video>
   * ============================================
   */
  return (
    <motion.span
      role="img"
      aria-label="Delivery scooter"
      className="block select-none text-3xl leading-none"
      animate={{
        y: bobbing ? [0, -6, 0] : 0,
        rotate: bobbing ? [-4, 4, -4] : 0,
      }}
      transition={{
        repeat: bobbing ? Infinity : 0,
        duration: 0.32,
        ease: "easeInOut",
      }}
    >
      🛵
    </motion.span>
  );
}

function VehicleDelivered({ burst }: { burst: boolean }) {
  /*
   * ============================================
   * TODO: REPLACE WITH CUSTOM 2D ANIMATION
   * Swap this emoji/SVG with:
   * <video autoPlay loop muted playsInline className="w-14 h-14">
   *   <source src="/animations/delivered.webm" type="video/webm" />
   * </video>
   * ============================================
   */
  return (
    <div className="relative">
      {burst && <CelebrationBurst />}
      <motion.span
        role="img"
        aria-label="House — delivered"
        className="block select-none text-3xl leading-none"
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
      >
        🏠
      </motion.span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type DeliveryStep = { status: string; label: string; timestamp: string };

type Props = { orderId: string; initialDeliverySteps: DeliveryStep[] };

export default function OrderTracker({ orderId, initialDeliverySteps }: Props) {
  const [deliverySteps, setDeliverySteps] = useState(initialDeliverySteps);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-tracker-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = (payload.new as { delivery_steps?: DeliveryStep[] })
            .delivery_steps;
          if (updated) setDeliverySteps(updated);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const stageIndex = resolveStageIndex(deliverySteps);
  const isDelivered = stageIndex === 4;
  // Road texture scrolls and vehicle bobs while the order is actively in transit
  const isMoving = stageIndex >= 1 && stageIndex <= 3;

  const trackRef = useRef<HTMLDivElement>(null);
  const [trackSize, setTrackSize] = useState(0);
  const [isVertical, setIsVertical] = useState(false);
  const [burst, setBurst] = useState(false);

  // Measure track and detect orientation; re-measure on resize
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 640;
      setIsVertical(mobile);
      if (trackRef.current) {
        setTrackSize(
          mobile
            ? trackRef.current.offsetHeight
            : trackRef.current.offsetWidth,
        );
      }
    };
    update();
    const obs = new ResizeObserver(update);
    if (trackRef.current) obs.observe(trackRef.current);
    return () => obs.disconnect();
  }, []);

  // Fire the celebration burst 700ms after parking at Delivered
  useEffect(() => {
    if (!isDelivered) return;
    const t = setTimeout(() => setBurst(true), 700);
    return () => clearTimeout(t);
  }, [isDelivered]);

  // ── Derived geometry ──────────────────────────────────────────────────────
  const percent = stageIndex / 4;
  // Vehicle left/top edge travels from 0 to (trackSize - VEHICLE_PX)
  const vehiclePos = trackSize > 0 ? percent * (trackSize - VEHICLE_PX) : 0;
  // Pixel centre of each stage marker along the track axis
  const markerCentres =
    trackSize > 0
      ? STAGES.map((_, i) => (i / 4) * (trackSize - VEHICLE_PX) + VEHICLE_PX / 2)
      : [];

  const vehicleSpring = { type: "spring", stiffness: 60, damping: 20 } as const;

  function renderVehicle() {
    switch (stageIndex) {
      case 0: return <VehicleOrderPlaced />;
      case 1: return <VehicleProcessing />;
      case 2: return <VehicleShipped bobbing={isMoving} />;
      case 3: return <VehicleOutForDelivery bobbing={isMoving} />;
      case 4: return <VehicleDelivered burst={burst} />;
      default: return <VehicleOrderPlaced />;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-zinc-100">
      <style>{ROAD_CSS}</style>

      <h2 className="mb-5 font-black text-zinc-700">Delivery Tracking</h2>

      {/* ── Road visualization ─────────────────────────────────────────────── */}
      <div className="mb-10">

        {/* Desktop: perspective wrapper gives the road a slight 3-D tilt */}
        <div
          style={
            isVertical
              ? undefined
              : { perspective: "700px" }
          }
        >
          <div
            style={
              isVertical
                ? undefined
                : { transform: "rotateX(7deg)", transformOrigin: "center bottom" }
            }
          >

            {/* Desktop stage labels — absolutely positioned above the road */}
            {!isVertical && markerCentres.length > 0 && (
              <div className="relative mb-2 h-5">
                {markerCentres.map((cx, i) => (
                  <span
                    key={i}
                    className={`absolute -translate-x-1/2 text-[10px] font-black uppercase tracking-wide ${
                      i <= stageIndex ? "text-pink-600" : "text-zinc-400"
                    }`}
                    style={{ left: cx }}
                  >
                    {STAGES[i].label}
                  </span>
                ))}
              </div>
            )}

            {/* Road + optional mobile label column */}
            <div className={isVertical ? "flex gap-5" : ""}>

              {/* ── The road itself ─────────────────────────────────────── */}
              <div
                ref={trackRef}
                className={`relative overflow-hidden rounded-xl ${
                  isVertical ? "h-72 w-20 flex-shrink-0" : "h-20 w-full"
                }`}
                style={{
                  background: "linear-gradient(to bottom, #3f3f46, #18181b)",
                }}
              >
                {/* Yellow shoulder / edge lines (like real road markings) */}
                <div
                  className={`absolute z-10 bg-yellow-400/70 ${
                    isVertical
                      ? "inset-x-0 top-0 h-[3px]"
                      : "inset-y-0 left-0 w-[3px]"
                  }`}
                />
                <div
                  className={`absolute z-10 bg-yellow-400/70 ${
                    isVertical
                      ? "inset-x-0 bottom-0 h-[3px]"
                      : "inset-y-0 right-0 w-[3px]"
                  }`}
                />

                {/* Scrolling road texture — animates while vehicle is moving */}
                <div
                  className={`absolute inset-0 ${
                    isMoving
                      ? isVertical
                        ? "road-moving-v"
                        : "road-moving-h"
                      : ""
                  }`}
                  style={{
                    backgroundImage: isVertical
                      ? "repeating-linear-gradient(180deg, transparent 0px, transparent 14px, rgba(255,255,255,0.05) 14px, rgba(255,255,255,0.05) 16px)"
                      : "repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(255,255,255,0.05) 14px, rgba(255,255,255,0.05) 16px)",
                  }}
                />

                {/* Dashed centre lane markings */}
                <div
                  className={`absolute ${
                    isVertical
                      ? "inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-white/20"
                      : "inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/20"
                  }`}
                />

                {/* Progress fill — coloured strip behind the vehicle */}
                <motion.div
                  className={`absolute bg-pink-500/25 ${
                    isVertical ? "inset-x-0 top-0" : "inset-y-0 left-0"
                  }`}
                  animate={
                    isVertical
                      ? { height: `${percent * 100}%` }
                      : { width: `${percent * 100}%` }
                  }
                  transition={vehicleSpring}
                />

                {/* Stage marker dots on the road surface */}
                {markerCentres.map((centre, i) => (
                  <div
                    key={i}
                    className="absolute z-10"
                    style={
                      isVertical
                        ? { top: centre - 5, left: "50%", transform: "translateX(-50%)" }
                        : { left: centre - 5, top: "50%", transform: "translateY(-50%)" }
                    }
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full ring-2 ring-zinc-800 ${
                        i <= stageIndex ? "bg-pink-400" : "bg-zinc-500"
                      }`}
                    />
                  </div>
                ))}

                {/* ── Vehicle ───────────────────────────────────────────── */}
                {trackSize > 0 && (
                  <motion.div
                    animate={
                      isVertical ? { y: vehiclePos } : { x: vehiclePos }
                    }
                    transition={vehicleSpring}
                    className="absolute z-20 flex items-center justify-center"
                    style={
                      isVertical
                        ? {
                            width: VEHICLE_PX,
                            height: VEHICLE_PX,
                            top: 0,
                            left: "50%",
                            marginLeft: -VEHICLE_PX / 2,
                          }
                        : {
                            width: VEHICLE_PX,
                            height: VEHICLE_PX,
                            left: 0,
                            top: "50%",
                            marginTop: -VEHICLE_PX / 2,
                          }
                    }
                  >
                    {renderVehicle()}
                  </motion.div>
                )}
              </div>
              {/* ── End road ─────────────────────────────────────────────── */}

              {/* Mobile: stage labels in a column to the right of the road */}
              {isVertical && markerCentres.length > 0 && (
                <div className="relative flex-1" style={{ height: 288 }}>
                  {markerCentres.map((centre, i) => (
                    <span
                      key={i}
                      className={`absolute left-0 text-[11px] font-black uppercase leading-tight tracking-wide ${
                        i <= stageIndex ? "text-pink-600" : "text-zinc-400"
                      }`}
                      style={{ top: centre - 9 }}
                    >
                      {STAGES[i].label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* End road + label row */}

          </div>
        </div>
        {/* End perspective wrapper */}

      </div>
      {/* End road visualization */}

      {/* ── Delivery steps timeline ────────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-400">
          Delivery Updates
        </h3>

        {deliverySteps.length > 0 ? (
          <ol className="relative space-y-4 border-l-2 border-zinc-200 pl-5">
            {deliverySteps.map((step, i) => {
              const isLatest = i === deliverySteps.length - 1;
              const isFuture = false; // steps are only added when they occur

              return (
                <li key={i} className="relative">
                  {/* Pulsing ring behind the dot for the current/latest step */}
                  {isLatest && (
                    <motion.span
                      className="absolute -left-[1.4rem] h-4 w-4 rounded-full bg-pink-400"
                      animate={{ scale: [1, 1.9, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                    />
                  )}

                  {/* Solid dot */}
                  <span
                    className={`absolute -left-[1.4rem] flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white ${
                      isFuture ? "bg-zinc-200" : isLatest ? "bg-pink-500" : "bg-zinc-400"
                    }`}
                  />

                  <p
                    className={`font-semibold ${
                      isLatest ? "text-zinc-900" : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm italic text-zinc-400">
            Tracking updates will appear here once your order ships.
          </p>
        )}
      </div>
    </div>
  );
}
