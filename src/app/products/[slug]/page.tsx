import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth";
import type { Product, Review, SalePrice } from "@/lib/types";
import { buildSalePriceMap } from "@/lib/sale-price";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductActions from "@/components/shop/ProductActions";
import ReviewsSection from "@/components/shop/ReviewsSection";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPageData(slug: string): Promise<{
  product: Product;
  reviews: Review[];
  isAdmin: boolean;
  userId: string | null;
  canReview: boolean;
  purchaseOrderId: string | undefined;
  userReview: Review | null;
  salePrice: SalePrice | null;
} | null> {
  const supabase = await createClient();

  const [productResult, authResult] = await Promise.all([
    supabase.from("products").select("*").eq("slug", slug).single(),
    supabase.auth.getUser(),
  ]);

  if (productResult.error || !productResult.data) return null;

  const product = productResult.data as Product;
  const user = authResult.data?.user ?? null;

  const [isAdmin, reviewsResult, salePriceMap] = await Promise.all([
    getIsAdmin(supabase, user?.id),
    supabase
      .from("reviews")
      .select("id, product_id, user_id, order_id, rating, comment, created_at, profiles(full_name)")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false }),
    buildSalePriceMap(supabase, [product]),
  ]);

  if (!product.is_published && !isAdmin) return null;

  const reviews = (reviewsResult.data ?? []) as unknown as Review[];

  // Check if the logged-in user has already reviewed this product
  const userReview = user
    ? (reviews.find((r) => r.user_id === user.id) ?? null)
    : null;

  // Check if the user has a paid/fulfilled order containing this product
  let canReview = false;
  let purchaseOrderId: string | undefined;

  if (user && !isAdmin) {
    const { data: purchaseRow } = await supabase
      .from("order_items")
      .select("order_id, orders!inner(id, status)")
      .eq("product_id", product.id)
      .in("orders.status", ["paid", "fulfilled"])
      .eq("orders.user_id", user.id)
      .limit(1)
      .single();

    if (purchaseRow) {
      canReview = true;
      purchaseOrderId = purchaseRow.order_id;
    }
  }

  return {
    product,
    reviews,
    isAdmin,
    userId: user?.id ?? null,
    canReview,
    purchaseOrderId,
    userReview,
    salePrice: salePriceMap[product.id] ?? null,
  };
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starClass = size === "lg" ? "text-2xl" : "text-base";
  return (
    <span className={`${starClass} leading-none`} aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={i < rating ? "text-yellow-400" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function averageRating(reviews: Review[]) {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPageData(slug);

  if (!data) notFound();

  const { product, reviews, isAdmin, userId, canReview, purchaseOrderId, userReview, salePrice } = data;
  const inStock = product.stock_quantity > 0;
  const avg = averageRating(reviews);
  const images = product.image_urls?.length > 0
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 px-4 py-8 sm:px-8 lg:px-12">
      {/* Top bar */}
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between">
        <nav className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/shop" className="hover:text-pink-600 transition-colors">Shop</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-800 truncate max-w-[200px]">{product.title}</span>
        </nav>

        {isAdmin && (
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit in Admin
          </Link>
        )}
      </div>

      {/* Main content */}
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-5">
        {/* Left — Gallery (3/5) */}
        <div className="lg:col-span-3">
          <ProductGallery images={images} title={product.title} />
        </div>

        {/* Right — Product info (2/5) */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Category + unpublished badge */}
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-900">
                {product.category}
              </span>
            )}
            {!product.is_published && (
              <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-500">
                Unpublished
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-black leading-tight tracking-tight text-zinc-900">
            {product.title}
          </h1>

          {/* Rating summary */}
          {avg !== null && (
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(avg)} size="sm" />
              <span className="text-sm font-bold text-zinc-500">
                {avg.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex flex-wrap items-center gap-3">
            {salePrice ? (
              <>
                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                  SALE
                </span>
                <span className="text-4xl font-black text-red-600">
                  ${(salePrice.sale_cents / 100).toFixed(2)}
                </span>
                <span className="text-xl font-bold text-zinc-400 line-through">
                  ${(product.price_cents / 100).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-4xl font-black text-red-600">
                ${(product.price_cents / 100).toFixed(2)}
              </span>
            )}
          </div>

          {/* Availability */}
          <div>
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                In Stock
                {product.stock_quantity <= 5 && (
                  <span className="ml-1 font-normal opacity-80">— only {product.stock_quantity} left</span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Sold Out
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-base leading-relaxed text-zinc-600">{product.description}</p>
          )}

          {/* Details */}
          {(product.dimensions || product.edition_size !== undefined || product.sku) && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-zinc-50 p-4 ring-2 ring-zinc-100">
              {product.dimensions && (
                <>
                  <dt className="text-xs font-black uppercase tracking-wider text-zinc-400">Dimensions</dt>
                  <dd className="text-sm font-semibold text-zinc-700">{product.dimensions}</dd>
                </>
              )}
              {product.edition_size !== null && product.edition_size !== undefined && (
                <>
                  <dt className="text-xs font-black uppercase tracking-wider text-zinc-400">Edition</dt>
                  <dd className="text-sm font-semibold text-zinc-700">
                    Limited — {product.edition_size} prints
                  </dd>
                </>
              )}
              {product.sku && (
                <>
                  <dt className="text-xs font-black uppercase tracking-wider text-zinc-400">SKU</dt>
                  <dd className="text-sm font-mono text-zinc-500">{product.sku}</dd>
                </>
              )}
            </dl>
          )}

          {inStock && (
            <ProductActions productId={product.id} maxQuantity={product.stock_quantity} />
          )}

          {!inStock && (
            <div className="rounded-2xl bg-zinc-50 p-4 text-center ring-2 ring-zinc-200">
              <p className="font-bold text-zinc-500">This piece is no longer available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewsSection
        initialReviews={reviews}
        productId={product.id}
        purchaseOrderId={purchaseOrderId}
        userId={userId}
        isAdmin={isAdmin}
        canReview={canReview}
        userReview={userReview}
      />
    </div>
  );
}
