"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";

type ReviewFormProps = {
  productId: string;
  orderId?: string;
  onReviewSubmitted: (review: Review) => void;
};

const STARS = [1, 2, 3, 4, 5];

export default function ReviewForm({ productId, orderId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId ?? undefined,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      onReviewSubmitted(data as Review);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hovered || rating;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-2 ring-yellow-200">
      <h3 className="mb-4 text-lg font-black text-zinc-900">Leave a Review</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Star selector */}
        <div>
          <p className="mb-2 text-sm font-bold text-zinc-500">Your rating</p>
          <div
            className="flex gap-1"
            onMouseLeave={() => setHovered(0)}
            role="group"
            aria-label="Star rating"
          >
            {STARS.map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none"
              >
                <span className={star <= displayRating ? "text-yellow-400" : "text-zinc-200"}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="review-comment" className="mb-2 block text-sm font-bold text-zinc-500">
            Comment <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think of this piece?"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 transition focus:border-yellow-400 focus:bg-white focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 ring-2 ring-red-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-black text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
