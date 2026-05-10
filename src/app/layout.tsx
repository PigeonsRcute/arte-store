import type { Metadata } from "next";
import { Playfair_Display, Inter, Space_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth";
import AdminBar from "@/components/admin/AdminBar";
import SiteHeader from "@/components/ui/SiteHeader";
import ClickExplosion from "@/components/ui/click-explosion";
import { CurrencyProvider } from "@/context/CurrencyContext";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Pigeon's Artillery - Art Store",
  description: "Circus-inspired art store with bold colors and playful energy.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  const isAdmin = await getIsAdmin(supabase, user?.id);

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1A1A1A]">
        <CurrencyProvider>
          <AdminBar />
          <SiteHeader isAdmin={isAdmin} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
          <ClickExplosion />
        </CurrencyProvider>
      </body>
    </html>
  );
}
