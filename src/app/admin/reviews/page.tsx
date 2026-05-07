import { createClient } from "@/lib/supabase/server";
import DeleteReviewButton from "./DeleteReviewButton";

const STAR_FILLED = "★";
const STAR_EMPTY = "☆";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-zinc-300"}>
          {i <= rating ? STAR_FILLED : STAR_EMPTY}
        </span>
      ))}
    </span>
  );
}

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, user_id, product_id, profiles(full_name), products(title, slug)",
    )
    .order("created_at", { ascending: false });

  const rows = (reviews ?? []) as unknown as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    user_id: string;
    product_id: string;
    profiles: { full_name: string | null } | null;
    products: { title: string; slug: string } | null;
  }>;

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-pink-300">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black tracking-tight text-pink-700">Reviews</h1>
        <span className="text-sm font-semibold text-zinc-400">{rows.length} total</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">No reviews yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-100 text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">Rating</th>
                <th className="pb-3 pr-4">Comment</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((review) => (
                <tr key={review.id} className="hover:bg-zinc-50">
                  <td className="py-3 pr-4 font-semibold text-zinc-700">
                    {review.profiles?.full_name ?? (
                      <span className="text-zinc-400">Unknown</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-zinc-700">
                    {review.products ? (
                      <a
                        href={`/products/${review.products.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-pink-600 hover:underline"
                      >
                        {review.products.title}
                      </a>
                    ) : (
                      <span className="text-zinc-400">Deleted product</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Stars rating={review.rating} />
                  </td>
                  <td className="max-w-xs py-3 pr-4 text-zinc-600">
                    {review.comment ? (
                      <span className="line-clamp-2">{review.comment}</span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-zinc-500">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 text-right">
                    <DeleteReviewButton reviewId={review.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
