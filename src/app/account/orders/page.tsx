import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/account?reason=signin_required");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, subtotal_cents, shipping_cents, total_cents, created_at")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/account"
            className="text-sm font-semibold text-zinc-400 transition hover:text-zinc-700"
          >
            ← Account
          </Link>
          <span className="text-zinc-300">/</span>
          <h1 className="text-2xl font-black text-zinc-900">My Orders</h1>
        </div>

        {!orders?.length ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-2 ring-yellow-200">
            <p className="text-xl font-black text-zinc-400">No orders yet.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Your completed orders will appear here.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-2xl bg-yellow-300 px-6 py-3 text-sm font-black text-zinc-900 transition hover:bg-yellow-200"
            >
              Browse the Gallery
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(orders as Order[]).map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-2 ring-zinc-100 transition hover:ring-pink-200"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-zinc-400">
                    {order.id.slice(0, 8)}…
                  </span>
                  <span className="text-sm text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black capitalize ${STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-lg font-black text-zinc-900">
                    ${(order.total_cents / 100).toFixed(2)}
                  </span>
                  <svg
                    className="h-4 w-4 text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
