"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FooterContent } from "@/lib/types";
import { useHoverColor } from "@/lib/use-hover-color";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Inline styles — light theme ─────────────────────────────────────────
const STYLES = `
.pa-footer-wrapper {
  font-family: var(--font-body, Inter, sans-serif);
  -webkit-font-smoothing: antialiased;

  --background: #FFFFFF;
  --foreground: #1A1A1A;
  --primary:    #FF3B3B;
  --secondary:  #FFD600;
  --border:     #1A1A1A;
  --muted-foreground: #6B6B6B;

  --pill-bg:          #FFFFFF;
  --pill-shadow:      rgba(26,26,26,0.25);
  --pill-border:      #1A1A1A;
  --pill-bg-hover:    #F5F5F0;
  --pill-shadow-hover:rgba(26,26,26,0.35);
}

@keyframes pa-breathe {
  0%   { transform: translate(-50%, -50%) scale(1);    opacity: 0.35; }
  100% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.6; }
}
@keyframes pa-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes pa-heartbeat {
  0%,100% { transform: scale(1);   filter: drop-shadow(0 0 4px #FF3B3B88); }
  20%,50% { transform: scale(1.3); filter: drop-shadow(0 0 10px #FF3B3Bcc); }
  35%     { transform: scale(1); }
}

.pa-breathe   { animation: pa-breathe   8s ease-in-out infinite alternate; }
.pa-marquee   { animation: pa-marquee  35s linear infinite; }
.pa-heartbeat { animation: pa-heartbeat 2s cubic-bezier(.25,1,.5,1) infinite; }

.pa-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, rgba(26,26,26,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(26,26,26,0.05) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.pa-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255,59,59,0.12) 0%,
    rgba(255,214,0,0.10) 40%,
    transparent 70%
  );
}

/* Light glass pill — design system button style */
.pa-glass {
  background-color: var(--pill-bg);
  border: 2px solid #1A1A1A;
  box-shadow: 4px 4px 0 #1A1A1A;
  border-radius: 0;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out, background-color 150ms;
  color: #1A1A1A;
}
.pa-glass:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #1A1A1A;
  background-color: var(--pill-bg-hover);
  color: #1A1A1A;
}

/* Primary CTA pill */
.pa-glass-primary {
  background-color: #FF3B3B;
  border: 2px solid #1A1A1A;
  box-shadow: 4px 4px 0 #1A1A1A;
  border-radius: 0;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  color: #FFFFFF;
}
.pa-glass-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #1A1A1A;
  color: #FFFFFF;
}

/* Secondary CTA pill */
.pa-glass-secondary {
  background-color: #FFD600;
  border: 2px solid #1A1A1A;
  box-shadow: 4px 4px 0 #1A1A1A;
  border-radius: 0;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  color: #1A1A1A;
}
.pa-glass-secondary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #1A1A1A;
}

.pa-giant-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(26,26,26,0.06);
  background: linear-gradient(180deg, rgba(26,26,26,0.07) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.pa-heading-bold {
  color: #1A1A1A;
  font-family: var(--font-display, serif);
}
`;

// ── Magnetic button ──────────────────────────────────────────────────────
type MagneticProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticProps>(
  ({ className, children, as: Tag = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const el = localRef.current;
      if (!el) return;

      const ctx = gsap.context(() => {
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width  / 2;
          const y = e.clientY - r.top  - r.height / 2;
          gsap.to(el, { x: x * 0.4, y: y * 0.4, rotationX: -y * 0.15, rotationY: x * 0.15, scale: 1.05, ease: "power2.out", duration: 0.4 });
        };
        const onLeave = () => {
          gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: "elastic.out(1,0.3)", duration: 1.2 });
        };
        el.addEventListener("mousemove", onMove as EventListener);
        el.addEventListener("mouseleave", onLeave);
        return () => {
          el.removeEventListener("mousemove", onMove as EventListener);
          el.removeEventListener("mouseleave", onLeave);
        };
      }, el);

      return () => ctx.revert();
    }, []);

    return (
      <Tag
        ref={(node: HTMLElement) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// ── Marquee content ──────────────────────────────────────────────────────
function MarqueeItem() {
  return (
    <div className="flex items-center space-x-10 px-6 font-black tracking-[0.25em] uppercase text-sm text-[#1A1A1A]">
      <span>Digital Art</span>          <span className="text-[#FF3B3B]">✦</span>
      <span>Original Prints</span>      <span className="text-[#FFD600]">✦</span>
      <span>2D Animation</span>         <span className="text-[#0047FF]">✦</span>
      <span>Mixed Media</span>          <span className="text-[#FF6BFF]">✦</span>
      <span>Limited Editions</span>     <span className="text-[#FF3B3B]">✦</span>
      <span>Commissions</span>          <span className="text-[#FFD600]">✦</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────
interface Props {
  content: FooterContent;
}

export default function Footer({ content }: Props) {
  const { shop_link, contact_link, social_links = [], tagline } = content;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantRef   = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef   = useRef<HTMLDivElement>(null);
  const { onClick: onHeadlineHover } = useHoverColor();

  useEffect(() => {
    if (typeof window === "undefined" || !wrapperRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(giantRef.current,
        { y: "12vh", scale: 0.82, opacity: 0 },
        { y: "0vh",  scale: 1,    opacity: 1, ease: "power1.out",
          scrollTrigger: { trigger: wrapperRef.current, start: "top 80%", end: "bottom bottom", scrub: 1 } }
      );
      gsap.fromTo([headingRef.current, linksRef.current],
        { y: 55, opacity: 0 },
        { y: 0,  opacity: 1, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: wrapperRef.current, start: "top 40%", end: "bottom bottom", scrub: 1 } }
      );
    }, wrapperRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Curtain-reveal wrapper */}
      <div
        ref={wrapperRef}
        className="relative h-screen w-full pa-footer-wrapper"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-white text-[#1A1A1A] pa-footer-wrapper" style={{ borderTop: "2px solid #1A1A1A" }}>

          {/* Aurora glow — red/yellow on white */}
          <div className="pa-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 pa-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          {/* Grid */}
          <div className="pa-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text */}
          <div
            ref={giantRef}
            className="pa-giant-text absolute -bottom-[4vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none font-display"
          >
            PIGEON&apos;S
          </div>

          {/* ── Marquee strip — yellow, black border ── */}
          <div className="absolute top-12 left-0 w-full overflow-hidden bg-[#FFD600] py-4 z-10 -rotate-2 scale-110" style={{ borderTop: "2px solid #1A1A1A", borderBottom: "2px solid #1A1A1A" }}>
            <div className="flex w-max pa-marquee">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* ── Centre content ── */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
            <h2
              ref={headingRef}
              className="text-5xl md:text-8xl font-black pa-heading-bold tracking-tighter mb-4 text-center"
              onClick={onHeadlineHover}
            >
              Collect something<br />beautiful.
            </h2>
            {tagline && (
              <p className="text-[#1A1A1A]/50 text-sm font-mono uppercase tracking-[0.25em] mb-10">{tagline}</p>
            )}

            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              {/* Primary CTA buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <MagneticButton
                  as={Link}
                  href={shop_link || "/shop"}
                  className="pa-glass-primary px-10 py-5 font-black text-sm md:text-base flex items-center gap-3"
                >
                  <span className="text-lg">🖼</span>
                  Browse the Gallery
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  href={contact_link || "/contact"}
                  className="pa-glass-secondary px-10 py-5 font-black text-sm md:text-base flex items-center gap-3"
                >
                  <span className="text-lg">✉</span>
                  Get in Touch
                </MagneticButton>
              </div>

              {/* Social / secondary links */}
              {social_links.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {social_links.map((link) => (
                    <MagneticButton
                      key={link.href}
                      as="a"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pa-glass px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[#6B6B6B] hover:text-[#1A1A1A]"
                    >
                      {link.label}
                    </MagneticButton>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "2px solid #1A1A1A" }}>
            <div className="font-mono text-[10px] md:text-xs font-bold tracking-widest uppercase text-[#6B6B6B] order-2 md:order-1">
              © 2026 Pigeon&apos;s Artillery. All rights reserved.
            </div>

            <div className="pa-glass px-6 py-3 flex items-center gap-2 order-1 md:order-2 cursor-default">
              <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#6B6B6B]">Made with</span>
              <span className="pa-heartbeat inline-block text-sm text-[#FF3B3B]">❤</span>
              <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#6B6B6B]">by Pigeon</span>
            </div>

            <MagneticButton
              as="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-12 h-12 pa-glass flex items-center justify-center group order-3"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
