import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { NailCustomOrder } from "@/lib/types";
import QuoteActions from "./QuoteActions";

const STATUS_LABEL: Record<string, string> = {
  quote_pending: "Quote pending",
  quoted: "Quote ready",
  confirmed: "Confirmed",
  in_progress: "In progress",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  quote_pending: "bg-yellow-100 text-yellow-700",
  quoted: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  in_progress: "bg-fuchsia-100 text-fuchsia-700",
  shipped: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

export default async function NailOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?reason=signin_required&next=/nails/orders");

  const { id } = await params;

  const { data, error } = await supabase
    .from("nail_custom_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[nails/orders/[id]] Supabase error:", error.code, error.message, error.details);
  }
  if (!data) {
    console.error("[nails/orders/[id]] No row returned for id:", id, "user:", authData.user.id);
    notFound();
  }

  const order = data as NailCustomOrder;
  const design = order.design as Record<string, string | null>;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/nails/orders"
        className="text-sm text-zinc-400 hover:text-fuchsia-600 transition w-fit"
      >
        ← My Orders
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-fuchsia-400">CUSTOM ORDER</p>
          <h1 className="text-3xl font-black text-zinc-800 capitalize">
            {order.shape} · {order.length.replace("_", " ")} · {order.finish.replace(/_/g, " ")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${STATUS_COLOR[order.status] ?? "bg-zinc-100 text-zinc-500"}`}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {/* Quote section — only shown once admin sets a price */}
      {order.final_price_cents ? (
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 p-6 ring-1 ring-fuchsia-200 flex flex-col gap-5">
          <h2 className="font-black text-zinc-800 text-lg">Your Quote</h2>
          <p className="text-4xl font-black text-fuchsia-700">
            ${(order.final_price_cents / 100).toFixed(2)}
          </p>

          {order.admin_notes && (
            <div className="rounded-xl bg-white/70 p-4 text-sm text-zinc-700 ring-1 ring-fuchsia-100">
              <span className="font-bold">Note from studio: </span>
              {order.admin_notes}
            </div>
          )}

          <QuoteActions orderId={order.id} status={order.status} />
        </div>
      ) : (
        <div className="rounded-2xl bg-yellow-50 p-5 ring-1 ring-yellow-100 text-sm text-yellow-800">
          Your quote is being prepared. We'll reach out once it's ready.
          {order.admin_notes && (
            <div className="mt-3 rounded-xl bg-white/60 p-3 ring-1 ring-yellow-100">
              <span className="font-bold">Studio note: </span>
              {order.admin_notes}
            </div>
          )}
        </div>
      )}

      {/* Order details */}
      <div className="rounded-2xl bg-white/80 p-6 ring-1 ring-pink-100 flex flex-col gap-5">
        <h2 className="font-black text-zinc-800">Order Details</h2>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <dt className="font-semibold text-zinc-400">Shape</dt>
          <dd className="text-zinc-800 capitalize">{order.shape}</dd>
          <dt className="font-semibold text-zinc-400">Length</dt>
          <dd className="text-zinc-800 capitalize">{order.length.replace("_", " ")}</dd>
          <dt className="font-semibold text-zinc-400">Finish</dt>
          <dd className="text-zinc-800 capitalize">{order.finish.replace(/_/g, " ")}</dd>
          {design.type && (
            <>
              <dt className="font-semibold text-zinc-400">Design type</dt>
              <dd className="text-zinc-800 capitalize">{design.type.replace("_", " ")}</dd>
            </>
          )}
          {design.color && (
            <>
              <dt className="font-semibold text-zinc-400">Color</dt>
              <dd className="text-zinc-800">{design.color}</dd>
            </>
          )}
          {design.notes && (
            <>
              <dt className="font-semibold text-zinc-400">Design notes</dt>
              <dd className="text-zinc-800">{design.notes}</dd>
            </>
          )}
        </dl>

        {Array.isArray(order.extras) && order.extras.length > 0 && (
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Extras</p>
            <div className="flex flex-wrap gap-2">
              {(order.extras as string[]).map((e) => (
                <span
                  key={e}
                  className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {order.sizes && Object.keys(order.sizes).length > 0 && (
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Sizes</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-sm">
              {Object.entries(order.sizes)
                .filter(([, v]) => v)
                .map(([finger, size]) => (
                  <div key={finger} className="flex justify-between rounded-lg bg-violet-50 px-3 py-1.5">
                    <span className="text-zinc-500">{finger}</span>
                    <span className="font-bold text-violet-700">{size}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Reference images */}
      {order.reference_images && order.reference_images.length > 0 && (
        <div className="rounded-2xl bg-white/80 p-6 ring-1 ring-pink-100 flex flex-col gap-4">
          <h2 className="font-black text-zinc-800">Reference Images</h2>
          <div className="flex flex-wrap gap-3">
            {order.reference_images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Reference ${i + 1}`}
                  className="h-32 w-32 rounded-2xl object-cover ring-1 ring-pink-200 hover:ring-fuchsia-400 transition"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
