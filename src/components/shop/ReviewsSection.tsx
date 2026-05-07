"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import ReviewForm from "@/components/shop/ReviewForm";

type ReviewsSectionProps = {
  initialReviews: Review[];
  productId: string;
  /** The order_id of the qualifying purchase, if any — passed to the review on submit */
  purchaseOrderId?: string;
  /** null = not logged in, string = logged-in user's id */
  userId: string | null;
  isAdmin: boolean;
  /** True when the user has a completed purchase of this product */
  canReview: boolean;
  /** The user's existing review, if they already left one */
  userReview: Review | null;
};

const STAR_INDICES = [0, 1, 2, 3, 4];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starClass = size === "lg" ? "text-2xl" : "text-base";
  return (
    <span className={`${starClass} leading-none`} aria-label={`${rating} out of 5 stars`}>
      {STAR_INDICES.map((i) => (
        <span key={i} className={i < rating ? "text-yellow-400" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function averageRating(reviews: Review[]) {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export default function ReviewsSection({
  initialReviews,
  productId,
  purchaseOrderId,
  userId,
  isAdmin,
  canReview,
  userReview: initialUserReview,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [userReview, setUserReview] = useState<Review | null>(initialUserReview);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const avg = averageRating(reviews);

  function handleReviewSubmitted(review: Review) {
    setReviews((prev) => [review, ...prev]);
    setUserReview(review);
  }

  async function handleDelete(reviewId: string) {
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        if (userReview?.id === reviewId) setUserReview(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mx-auto mt-16 max-w-6xl">
      {/* Section header */}
      <div className="mb-6 flex items-baseline gap-4">
        <h2 className="text-2xl font-black text-zinc-900">Reviews</h2>
        {avg !== null && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(avg)} />
            <span className="text-sm font-bold text-zinc-500">{avg.toFixed(1)} avg</span>
          </div>
        )}
      </div>

      {/* Review form — shown to purchasers who haven't reviewed yet */}
      {canReview && !userReview && (
        <div className="mb-8">
          <ReviewForm
            productId={productId}
            orderId={purchaseOrderId}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {/* Sign-in nudge for guests */}
      {!userId && (
        <div className="mb-8 rounded-2xl bg-zinc-50 px-6 py-4 ring-2 ring-zinc-100">
          <p className="text-sm font-semibold text-zinc-500">
            <a href="/account" className="font-black text-pink-600 hover:underline">
              Sign in
            </a>{" "}
            to leave a review after your purchase.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-2 ring-yellow-200">
          <p className="text-lg font-black text-zinc-400">No reviews yet.</p>
          {canReview && !userReview ? (
            <p className="mt-1 text-sm text-zinc-400">Be the first to review this piece.</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">
              Reviews from verified buyers will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => {
            const isOwn = review.user_id === userId;
            return (
              <article
                key={review.id}
                className={`flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-2 ${
                  isOwn ? "ring-yellow-300" : "ring-zinc-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-red-500 text-sm font-black text-white">
                      {review.profiles?.full_name
                        ? review.profiles.full_name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-800">
                        {review.profiles?.full_name ?? "Anonymous"}
                        {isOwn && (
                          <span className="ml-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    {(isAdmin || isOwn) && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        aria-label="Delete review"
                        className="ml-1 rounded-lg p-1 text-zinc-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      >
                        {deletingId === review.id ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm leading-relaxed text-zinc-600">{review.comment}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
