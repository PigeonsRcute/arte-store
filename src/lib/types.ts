export type AdminRole = "owner" | "editor" | "support" | "viewer" | "nails_admin";
export type UserRole = "customer" | AdminRole;

export interface AdminPermission {
  role: AdminRole;
  section: string;
  can_read: boolean;
  can_write: boolean;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  stock_quantity: number;
  image_url: string | null;
  image_urls: string[];
  sku: string | null;
  category: string | null;
  dimensions: string | null;
  edition_size: number | null;
  shipping_cost_cents: number;
  is_published: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  is_test_order: boolean;
  delivery_steps: Array<{ status: string; label: string; timestamp: string; note?: string }>;
  shipping_name: string | null;
  shipping_street: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  shipping_cost_cents: number;
  products?: Pick<Product, "id" | "title" | "image_url" | "image_urls" | "slug">;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string | null;
  nail_product_id: string | null;
  quantity: number;
  created_at: string;
}

export interface CartItemWithProduct extends CartItem {
  products: Product | null;
  nail_products: NailProduct | null;
}

// --- Categories ---

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  gradient_from: string;
  gradient_to: string;
  sort_order: number;
  created_at: string;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;
}

// --- Sale Events ---

export type EventStatus = "draft" | "scheduled" | "live" | "ended";
export type DiscountType = "percent" | "fixed";

export interface SaleEvent {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  discount_type: DiscountType;
  discount_value: number;
  status: EventStatus;
  starts_at: string | null;
  ends_at: string | null;
  free_shipping_threshold_cents: number | null;
  created_at: string;
  updated_at: string;
}

// --- Shipping ---

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  flat_rate_cents: number;
  weight_rate_cents_per_kg: number;
}

export interface ShippingSettings {
  id: string;
  global_free_shipping_threshold_cents: number;
}

export interface EventProduct {
  event_id: string;
  product_id: string;
  discount_value: number | null;
}

export interface EventCategory {
  event_id: string;
  category_id: string;
  discount_value: number | null;
}

// Resolved sale price for a product given active events
export interface SalePrice {
  original_cents: number;
  sale_cents: number;
  discount_type: DiscountType;
  discount_value: number;
  event_name: string;
}

// --- Homepage Content ---

export interface HomepageContent {
  id: string;
  section: string;
  content: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}

export interface AnnouncementsContent {
  text: string;
  link?: string;
  link_label?: string;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_link: string;
  bg_image_url?: string;
}

export interface PromotionsContent {
  badge_label: string;
  blurb: string;
  product_ids: string[];
  discount_text: string;
}

export interface FeaturedProductsContent {
  headline: string;
  product_ids: string[];
}

export interface EventsContent {
  headline: string;
  selected_event_ids: string[];
}

export interface ComingSoonContent {
  title: string;
  expected_date?: string;
  teaser_image_url?: string;
}

export interface FooterContent {
  tagline: string;
  shop_link: string;
  contact_link: string;
  social_links: Array<{ label: string; href: string }>;
}

// --- Nails Homepage Content ---

export interface NailHomepageContent {
  id: string;
  section: string;
  content: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}

export interface NailAnnouncementsBarContent {
  text: string;
  link?: string;
  link_label?: string;
}

export interface NailHeroContent {
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_link: string;
  bg_image_url?: string;
}

export interface NailPromotionsContent {
  badge_label: string;
  blurb: string;
  product_ids: string[];
  discount_text: string;
}

export interface NailFeaturedProductsContent {
  headline: string;
  product_ids: string[];
}

export interface NailEventsContent {
  headline: string;
  selected_event_ids: string[];
}

export interface NailComingSoonContent {
  title: string;
  expected_date?: string;
  teaser_image_url?: string;
}

export interface NailGeneralAnnouncementsItem {
  id: string;
  title: string;
  body: string;
}

export interface NailGeneralAnnouncementsContent {
  items: NailGeneralAnnouncementsItem[];
}

// --- Nails ---

export type NailShape = "coffin" | "almond" | "square" | "stiletto" | "oval" | "ballerina";
export type NailLength = "short" | "medium" | "long" | "extra_long";
export type NailFinish = "glossy_top_coat" | "matte_top_coat" | "glittery_top_coat" | "silvery_top_coat";
export type NailCostType = "flat" | "per_unit";
export type NailCustomOrderStatus =
  | "quote_pending"
  | "quoted"
  | "confirmed"
  | "in_progress"
  | "shipped"
  | "cancelled";

export interface NailProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  images: string[];
  price_cents: number;
  shape: NailShape;
  length: NailLength;
  finish: NailFinish;
  stock_qty: number;
  is_published: boolean;
  created_at: string;
}

export interface NailMaterial {
  id: string;
  name: string;
  cost_cents: number;
  unit: string;
  supplier: string | null;
  stock_qty: number;
  created_at: string;
}

export interface NailPricingRule {
  id: string;
  shape: NailShape;
  length: NailLength;
  base_price_cents: number;
  updated_at: string;
}

export interface NailExtra {
  id: string;
  name: string;
  cost_type: NailCostType;
  cost_cents: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface NailCustomOrder {
  id: string;
  user_id: string;
  shape: NailShape;
  length: NailLength;
  finish: NailFinish;
  design: Record<string, unknown>;
  extras: string[];
  sizes: Record<string, string>;
  reference_images: string[];
  calculated_price_cents: number | null;
  final_price_cents: number | null;
  status: NailCustomOrderStatus;
  admin_notes: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null };
}

export interface NailSizingSubmission {
  id: string;
  user_id: string;
  method: "physical" | "photo";
  sizes: Record<string, string>;
  photo_urls: string[];
  order_id: string | null;
  submitted_at: string;
  profiles?: { full_name: string | null; email: string | null };
}
