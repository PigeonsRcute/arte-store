"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CurrencyPicker from "@/components/ui/CurrencyPicker";

interface Props {
  isAdmin: boolean;
}

export default function SiteHeader({ isAdmin }: Props) {
  const pathname = usePathname();
  const isNails = pathname.startsWith("/nails");

  return isNails ? (
    <NailsHeader isAdmin={isAdmin} />
  ) : (
    <ArtHeader isAdmin={isAdmin} />
  );
}

function ArtHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="border-b-2 border-[#1A1A1A] bg-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <SiteSwitcher active="art" />
          <Link
            href="/"
            className="font-display text-lg font-black tracking-tight text-[#1A1A1A]"
          >
            Pigeon&apos;s Artillery
          </Link>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold">
          <Link
            href="/shop"
            className="text-[#0047FF] transition-colors hover:text-[#FF3B3B]"
          >
            Shop
          </Link>
          <Link
            href="/gallery"
            className="text-[#0047FF] transition-colors hover:text-[#FF3B3B]"
          >
            Gallery
          </Link>
          <Link
            href="/cart"
            className="text-[#0047FF] transition-colors hover:text-[#FF3B3B]"
          >
            Cart
          </Link>
          <Link
            href="/account"
            className="text-[#0047FF] transition-colors hover:text-[#FF3B3B]"
          >
            Account
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3B3B] transition-colors hover:text-[#1A1A1A]"
            >
              Admin
            </Link>
          )}
          <CurrencyPicker />
        </div>
      </nav>
    </header>
  );
}

function NailsHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="border-b-2 border-[#1A1A1A] bg-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <SiteSwitcher active="nails" />
          <Link
            href="/nails"
            className="font-display text-lg font-black tracking-tight text-[#1A1A1A]"
          >
            Pigeon&apos;s Artillery
          </Link>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold">
          <Link
            href="/nails/shop"
            className="text-[#7C3AED] transition-colors hover:text-[#FF3B3B]"
          >
            Shop
          </Link>
          <Link
            href="/nails/custom"
            className="text-[#7C3AED] transition-colors hover:text-[#FF3B3B]"
          >
            Custom
          </Link>
          <Link
            href="/nails/sizing-kit"
            className="text-[#7C3AED] transition-colors hover:text-[#FF3B3B]"
          >
            Sizing Kit
          </Link>
          <Link
            href="/cart"
            className="text-[#7C3AED] transition-colors hover:text-[#FF3B3B]"
          >
            Cart
          </Link>
          <Link
            href="/account"
            className="text-[#7C3AED] transition-colors hover:text-[#FF3B3B]"
          >
            Account
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF3B3B] transition-colors hover:text-[#1A1A1A]"
            >
              Admin
            </Link>
          )}
          <CurrencyPicker />
        </div>
      </nav>
    </header>
  );
}

function SiteSwitcher({ active }: { active: "art" | "nails" }) {
  return (
    <div className="flex items-center border-2 border-[#1A1A1A]">
      <Link
        href="/"
        className={`px-3 py-1 font-mono text-xs font-black tracking-widest transition-colors ${
          active === "art"
            ? "bg-[#FF3B3B] text-white"
            : "bg-white text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
        }`}
      >
        ART
      </Link>
      <Link
        href="/nails"
        className={`border-l-2 border-[#1A1A1A] px-3 py-1 font-mono text-xs font-black tracking-widest transition-colors ${
          active === "nails"
            ? "bg-[#7C3AED] text-white"
            : "bg-white text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
        }`}
      >
        NAILS
      </Link>
    </div>
  );
}
