import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NailsHero from "@/components/nails/NailsHero";
import AnnouncementsBar from "@/components/homepage/AnnouncementsBar";
import Events from "@/components/homepage/Events";
import ComingSoon from "@/components/homepage/ComingSoon";
import NailsFeaturedProducts from "@/components/nails/homepage/NailsFeaturedProducts";
import NailsPromotionsBanner from "@/components/nails/homepage/NailsPromotionsBanner";
import NailsGeneralAnnouncements from "@/components/nails/homepage/NailsGeneralAnnouncements";
import type {
  NailAnnouncementsBarContent,
  NailHeroContent,
  NailPromotionsContent,
  NailFeaturedProductsContent,
  NailEventsContent,
  NailComingSoonContent,
  NailGeneralAnnouncementsContent,
  NailProduct,
} from "@/lib/types";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse or Build",
    body: "Pick a ready-made set from the shop or open the custom builder and design from scratch.",
    color: "from-pink-100 to-fuchsia-50",
    accent: "text-pink-500",
  },
  {
    step: "02",
    title: "Send Your Sizes",
    body: "Order a free sizing kit, try it on, and submit your measurements — or use our size guide.",
    color: "from-fuchsia-100 to-violet-50",
    accent: "text-fuchsia-500",
  },
  {
    step: "03",
    title: "We Handcraft It",
    body: "Every set is made by hand. Custom orders include a quote before production starts.",
    color: "from-violet-100 to-purple-50",
    accent: "text-violet-500",
  },
  {
    step: "04",
    title: "It Arrives Ready",
    body: "Nails arrive prepped, filed, and ready to apply. Included: mini glue tabs and instructions.",
    color: "from-purple-100 to-pink-50",
    accent: "text-purple-500",
  },
];

export default async function NailsHomePage() {
  const supabase = await createClient();

  const { data: sections } = await supabase
    .from("nail_homepage_content")
    .select("section, content, is_active");

  type Row = { section: string; content: Record<string, unknown>; is_active: boolean };
  const bySection = Object.fromEntries(
    (sections ?? []).map((r: Row) => [r.section, r])
  );

  // Returns typed content when section is active, null otherwise
  const get = <T,>(key: string): T | null =>
    bySection[key]?.is_active ? (bySection[key].content as T) : null;

  // Collect nail product IDs needed by active sections
  const promotionsContent  = get<NailPromotionsContent>("promotions");
  const featuredContent    = get<NailFeaturedProductsContent>("featured_products");

  const allProductIds = [
    ...(promotionsContent?.product_ids ?? []),
    ...(featuredContent?.product_ids   ?? []),
  ].filter(Boolean);

  // Fetch referenced nail products in a single query
  let productMap: Record<string, NailProduct> = {};
  if (allProductIds.length > 0) {
    const { data: productRows } = await supabase
      .from("nail_products")
      .select("*")
      .in("id", allProductIds)
      .eq("is_published", true);
    productMap = Object.fromEntries(
      (productRows ?? []).map((p: NailProduct) => [p.id, p])
    );
  }

  // Featured: use CMS IDs if configured, else fall back to 4 latest published
  let featuredProducts: NailProduct[] = (featuredContent?.product_ids ?? [])
    .map((id: string) => productMap[id])
    .filter(Boolean);

  if (featuredContent && featuredProducts.length === 0) {
    const { data: latest } = await supabase
      .from("nail_products")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4);
    featuredProducts = (latest ?? []) as NailProduct[];
  }

  const promotionsProducts: NailProduct[] = (promotionsContent?.product_ids ?? [])
    .map((id: string) => productMap[id])
    .filter(Boolean);

  const announcementsContent       = get<NailAnnouncementsBarContent>("announcements_bar");
  const heroContent                = get<NailHeroContent>("hero");
  const eventsContent              = get<NailEventsContent>("events");
  const comingSoonContent          = get<NailComingSoonContent>("coming_soon");
  const generalAnnouncementsContent = get<NailGeneralAnnouncementsContent>("general_announcements");

  return (
    <div className="flex flex-col gap-0">

      {/* Announcements bar — full-bleed, sits above all content */}
      {announcementsContent && (
        <AnnouncementsBar content={announcementsContent} variant="nails" />
      )}

      <div className="flex flex-col gap-20 px-4 py-8 md:px-8">

        {/* Hero — always renders; uses CMS content when active, defaults otherwise */}
        <NailsHero content={heroContent ?? undefined} />

        {/* Sales & Promotions */}
        {promotionsContent && (
          <NailsPromotionsBanner
            content={promotionsContent}
            products={promotionsProducts}
          />
        )}

        {/* Featured / New Releases */}
        {featuredContent ? (
          <NailsFeaturedProducts
            content={featuredContent}
            products={featuredProducts}
          />
        ) : (
          /* Hardcoded placeholder while CMS section is inactive */
          <section>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-bold tracking-widest text-fuchsia-400">READY TO WEAR</p>
                <h2 className="text-3xl font-black text-zinc-800">Featured Sets</h2>
              </div>
              <Link
                href="/nails/shop"
                className="rounded-full border border-fuchsia-200 px-5 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50"
              >
                View all →
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/60 py-20 text-center ring-1 ring-pink-100">
              <span className="text-5xl">💅</span>
              <p className="font-semibold text-zinc-500">First sets dropping soon.</p>
              <Link
                href="/nails/custom"
                className="rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white"
              >
                Order custom now
              </Link>
            </div>
          </section>
        )}

        {/* How it works — hardcoded, not CMS-managed */}
        <section>
          <div className="mb-8 text-center">
            <p className="mb-1 text-xs font-bold tracking-widest text-fuchsia-400">THE PROCESS</p>
            <h2 className="text-3xl font-black text-zinc-800">How it works</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, body, color, accent }) => (
              <div
                key={step}
                className={`flex flex-col gap-3 rounded-2xl bg-gradient-to-br ${color} p-6 ring-1 ring-white`}
              >
                <span className={`text-4xl font-black ${accent} opacity-30`}>{step}</span>
                <h3 className="text-lg font-black text-zinc-800">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Events */}
        {eventsContent && (
          <Events content={eventsContent} variant="nails" />
        )}

        {/* Coming Soon */}
        {comingSoonContent && (
          <ComingSoon content={comingSoonContent} variant="nails" />
        )}

        {/* Sizing kit CTA — hardcoded, not CMS-managed */}
        <section className="rounded-3xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 px-10 py-16 text-center ring-1 ring-violet-200">
          <p className="mb-2 text-xs font-bold tracking-widest text-violet-500">FREE KIT</p>
          <h2 className="mb-3 text-3xl font-black text-zinc-800">Not sure about your size?</h2>
          <p className="mx-auto mb-8 max-w-sm text-zinc-600">
            Order a free sizing kit. Try on the sample nails, find your perfect fit,
            and submit your measurements — we take it from there.
          </p>
          <Link
            href="/nails/sizing-kit"
            className="inline-block rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-10 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:scale-105 hover:shadow-xl hover:shadow-violet-300"
          >
            Get my sizing kit
          </Link>
        </section>

        {/* General Announcements */}
        {generalAnnouncementsContent && (
          <NailsGeneralAnnouncements content={generalAnnouncementsContent} />
        )}

      </div>
    </div>
  );
}
