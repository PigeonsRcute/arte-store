import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order, NailCustomOrder } from "@/lib/types";

// ── Art order status ─────────────────────────────────────────────────────────

const ART_STATUS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  paid:      "bg-blue-100 text-blue-800",
  fulfilled: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

// ── Nail order status ─────────────────────────────────────────────────────────

const NAIL_STATUS_LABEL: Record<string, string> = {
  quote_pending: "Quote pending",
  quoted:        "Quote ready",
  confirmed:     "Confirmed",
  in_progress:   "In progress",
  shipped:       "Shipped",
  cancelled:     "Cancelled",
};

const NAIL_STATUS: Record<string, string> = {
  quote_pending: "bg-yellow-100 text-yellow-800",
  quoted:        "bg-blue-100 text-blue-800",
  confirmed:     "bg-green-100 text-green-800",
  in_progress:   "bg-fuchsia-100 text-fuchsia-800",
  shipped:       "bg-emerald-100 text-emerald-800",
  cancelled:     "bg-red-100 text-red-800",
};

function humanise(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── Combined row types ────────────────────────────────────────────────────────

type ArtRow  = { kind: "art";  order: Order;            created_at: string };
type NailRow = { kind: "nail"; order: NailCustomOrder;  created_at: string };
type Row = ArtRow | NailRow;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/account?reason=signin_required");

  const uid = authData.user.id;

  const [{ data: artOrders }, { data: nailOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, subtotal_cents, shipping_cents, total_cents, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),
    supabase
      .from("nail_custom_orders")
      .select("id, status, shape, length, finish, calculated_price_cents, final_price_cents, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),
  ]);

  const rows: Row[] = [
    ...(artOrders  ?? []).map(o => ({ kind: "art"  as const, order: o as Order,            created_at: o.created_at })),
    ...(nailOrders ?? []).map(o => ({ kind: "nail" as const, order: o as NailCustomOrder,  created_at: o.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

        {rows.length === 0 ? (
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
            {rows.map(row => row.kind === "art" ? (
              <ArtOrderRow key={`art-${row.order.id}`} order={row.order} />
            ) : (
              <NailOrderRow key={`nail-${row.order.id}`} order={row.order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Art order row ─────────────────────────────────────────────────────────────

function ArtOrderRow({ order }: { order: Order }) {
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-2 ring-zinc-100 transition hover:ring-pink-200"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-pink-700">
            Art Order
          </span>
          <span className="font-mono text-xs text-zinc-400">{order.id.slice(0, 8)}…</span>
        </div>
        <span className="text-sm text-zinc-500">
          {new Date(order.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
          })}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${ART_STATUS[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
          {order.status}
        </span>
        <span className="text-lg font-black text-zinc-900">
          ${(order.total_cents / 100).toFixed(2)}
        </span>
        <Chevron />
      </div>
    </Link>
  );
}

// ── Nail order row ────────────────────────────────────────────────────────────

function NailOrderRow({ order }: { order: NailCustomOrder }) {
  const priceCents = order.final_price_cents ?? order.calculated_price_cents;
  const summary = [humanise(order.shape), humanise(order.length), humanise(order.finish)].join(" · ");

  return (
    <Link
      href={`/nails/orders/${order.id}`}
      className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-2 ring-zinc-100 transition hover:ring-fuchsia-200"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-fuchsia-700">
            Nail Order
          </span>
          <span className="font-mono text-xs text-zinc-400">{order.id.slice(0, 8)}…</span>
        </div>
        <span className="text-sm font-semibold text-zinc-700">Custom Nail Order</span>
        <span className="text-xs text-zinc-400">{summary}</span>
        <span className="text-xs text-zinc-400">
          {new Date(order.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
          })}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${NAIL_STATUS[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
          {NAIL_STATUS_LABEL[order.status] ?? order.status}
        </span>
        {priceCents != null ? (
          <span className="text-lg font-black text-zinc-900">
            ${(priceCents / 100).toFixed(2)}
          </span>
        ) : (
          <span className="text-sm font-semibold text-zinc-400">TBD</span>
        )}
        <Chevron />
      </div>
    </Link>
  );
}

function Chevron() {
  return (
    <svg className="h-4 w-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}
