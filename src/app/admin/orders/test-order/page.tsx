import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TestOrderForm from "@/components/admin/TestOrderForm";

export default async function TestOrderPage() {
  const supabase = await createClient();

  const [customersResult, productsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, street, city, postal_code, country")
      .order("full_name"),
    supabase
      .from("products")
      .select("id, title, price_cents")
      .eq("is_published", true)
      .order("title"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="text-sm font-semibold text-zinc-400 hover:text-zinc-700"
        >
          ← Orders
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-500">Create Test Order</span>
      </div>

      <section className="space-y-6 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-green-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-green-700">Create Test Order</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Creates a real order row marked as test. Bypasses PayPal. Stock is not decremented.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-black tracking-wider text-orange-700">
            TEST
          </span>
        </div>

        <TestOrderForm
          customers={customersResult.data ?? []}
          products={productsResult.data ?? []}
        />
      </section>
    </div>
  );
}
