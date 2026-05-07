import { createClient } from "@/lib/supabase/server";
import type {
  AnnouncementsContent,
  HeroContent,
  PromotionsContent,
  FeaturedProductsContent,
  ComingSoonContent,
  FooterContent,
  Product,
  Category,
  SaleEvent,
} from "@/lib/types";

import AnnouncementsBar  from "@/components/homepage/AnnouncementsBar";
import Hero              from "@/components/homepage/Hero";
import PromotionsBanner  from "@/components/homepage/PromotionsBanner";
import FeaturedProducts  from "@/components/homepage/FeaturedProducts";
import Events            from "@/components/homepage/Events";
import ComingSoon        from "@/components/homepage/ComingSoon";
import Footer            from "@/components/homepage/Footer";
import CategoryPreview   from "@/components/homepage/CategoryPreview";

export const dynamic = "force-dynamic";

// Default content used when the DB row is missing (graceful degradation)
const DEFAULTS = {
  hero: {
    headline: "PIGEON'S ARTILLERY",
    subheadline: "Original artwork. Bold colour. Made to hang.",
    cta_text: "Explore the Gallery",
    cta_link: "/shop",
    bg_image_url: "",
  } satisfies HeroContent,

  featured_products: {
    headline: "New Releases",
    product_ids: [],
  } satisfies FeaturedProductsContent,

  footer: {
    tagline: "Art that hits like artillery.",
    shop_link: "/shop",
    contact_link: "/contact",
    social_links: [],
  } satisfies FooterContent,
};

export default async function Home() {
  const supabase = await createClient();

  // Fetch all active homepage_content rows in one query
  const { data: sections } = await supabase
    .from("homepage_content")
    .select("section, content, is_active")
    .throwOnError();

  type Row = { section: string; content: Record<string, unknown>; is_active: boolean };
  const bySection = Object.fromEntries(
    (sections ?? []).map((r: Row) => [r.section, r])
  );

  const get = <T,>(key: string): T | null =>
    bySection[key]?.is_active ? (bySection[key].content as T) : null;

  // Fetch categories for the preview section
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .throwOnError();
  const categories: Category[] = categoriesData ?? [];

  // Collect product IDs needed by promotions + featured sections
  const promotionsContent = get<PromotionsContent>("promotions");
  const featuredContent   = get<FeaturedProductsContent>("featured_products")
                            ?? DEFAULTS.featured_products;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const productIds = [
    ...(promotionsContent?.product_ids ?? []),
    ...(featuredContent.product_ids   ?? []),
  ].filter((id): id is string => typeof id === "string" && UUID_RE.test(id));

  let products: Product[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id, slug, title, category, image_url, image_urls, price_cents")
      .in("id", productIds)
      .eq("is_published", true)
      .throwOnError();
    products = (data ?? []) as Product[];
  }

  const announcementsContent = get<AnnouncementsContent>("announcements");
  const heroContent          = get<HeroContent>("hero") ?? DEFAULTS.hero;
  const comingSoonContent    = get<ComingSoonContent>("coming_soon");
  const footerContent        = get<FooterContent>("footer")              ?? DEFAULTS.footer;

  // Events: read selected IDs from homepage_content, then fetch live/scheduled events from events table
  const eventsRow        = bySection["events"];
  const eventsHeadline   = String((eventsRow?.content as { headline?: string })?.headline ?? "Upcoming Events");
  const rawEventIds      = Array.isArray((eventsRow?.content as { selected_event_ids?: unknown[] })?.selected_event_ids)
    ? ((eventsRow.content as { selected_event_ids: unknown[] }).selected_event_ids as string[]).filter((id): id is string => typeof id === "string" && UUID_RE.test(id))
    : [];

  let featuredEvents: SaleEvent[] = [];
  if (rawEventIds.length > 0) {
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, name, description, banner_url, discount_type, discount_value, status, starts_at, ends_at, free_shipping_threshold_cents, created_at, updated_at")
      .in("id", rawEventIds)
      .in("status", ["live", "scheduled"])
      .throwOnError();
    featuredEvents = (eventsData ?? []) as SaleEvent[];
  }

  const promoProducts  = promotionsContent
    ? products.filter(p => promotionsContent.product_ids.includes(p.id))
    : [];
  const featuredProds  = products.filter(p => featuredContent.product_ids.includes(p.id));

  return (
    /*
     * Full-bleed wrapper: cancels the max-w-6xl + px-6 + py-8 from <main>.
     * Each section manages its own internal max-width.
     */
    <div
      className="-my-8"
      style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
    >
      {announcementsContent && (
        <AnnouncementsBar content={announcementsContent} />
      )}

      <Hero content={heroContent} />

      {promotionsContent && (
        <PromotionsBanner content={promotionsContent} products={promoProducts} />
      )}

      <FeaturedProducts content={featuredContent} products={featuredProds} />

      {categories.length > 0 && (
        <CategoryPreview categories={categories} />
      )}

      <Events headline={eventsHeadline} events={featuredEvents} />

      {comingSoonContent && (
        <ComingSoon content={comingSoonContent} />
      )}

      <Footer content={footerContent} />
    </div>
  );
}
