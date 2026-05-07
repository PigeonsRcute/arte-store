import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";

const cormorant = Cormorant_Garamond({
  variable: "--font-nails-display",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-nails-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function NailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${cormorant.variable} ${plusJakarta.variable} -mx-6 -my-8 min-h-screen surface-nails`}
      style={
        {
          "--font-display": "var(--font-nails-display)",
          "--font-body": "var(--font-nails-body)",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
