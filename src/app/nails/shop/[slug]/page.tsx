import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NailAddToCartButton from "@/components/nails/NailAddToCartButton";
import type { NailProduct } from "@/lib/types";

const SHAPE_LABEL: Record<string, string> = {
  coffin: "Coffin", almond: "Almond", square: "Square",
  stiletto: "Stiletto", oval: "Oval", ballerina: "Ballerina",
};
const LENGTH_LABEL: Record<string, string> = {
  short: "Short", medium: "Medium", long: "Long", extra_long: "Extra Long",
};
const FINISH_LABEL: Record<string, string> = {
  glossy: "Glossy", matte: "Matte", chrome: "Chrome",
  holographic: "Holographic", velvet: "Velvet",
};

export default async function NailProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("nail_products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const product = data as NailProduct;

  const price = (product.price_cents / 100).toFixed(2);
  const images = product.images.length > 0 ? product.images : [];

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/nails" className="hover:text-fuchsia-600 transition">Nails</Link>
        <span>/</span>
        <Link href="/nails/shop" className="hover:text-fuchsia-600 transition">Shop</Link>
        <span>/</span>
        <span className="text-zinc-700 font-semibold">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50">
            {images[0] ? (
              <img
                src={images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">💅</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-purple-50"
                >
                  <img src={img} alt={`${product.name} view ${i + 2}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-black text-zinc-900">{product.name}</h1>
            <p className="mt-2 text-3xl font-black bg-gradient-to-r from-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
              ${price}
            </p>
          </div>

          {product.description && (
            <p className="leading-relaxed text-zinc-600">{product.description}</p>
          )}

          {/* Specs */}
          <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-pink-100 flex flex-col gap-3">
            <h2 className="text-xs font-black tracking-widest text-fuchsia-400">DETAILS</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="font-semibold text-zinc-500">Shape</dt>
              <dd className="font-bold text-zinc-800">{SHAPE_LABEL[product.shape] ?? product.shape}</dd>
              <dt className="font-semibold text-zinc-500">Length</dt>
              <dd className="font-bold text-zinc-800">{LENGTH_LABEL[product.length] ?? product.length}</dd>
              <dt className="font-semibold text-zinc-500">Finish</dt>
              <dd className="font-bold text-zinc-800">{FINISH_LABEL[product.finish] ?? product.finish}</dd>
              <dt className="font-semibold text-zinc-500">In stock</dt>
              <dd className="font-bold text-zinc-800">{product.stock_qty > 0 ? product.stock_qty : "—"}</dd>
            </dl>
          </div>

          <NailAddToCartButton
            nailProductId={product.id}
            stockQty={product.stock_qty}
          />

          <p className="text-center text-xs text-zinc-400">
            Not sure about sizing?{" "}
            <Link href="/nails/sizing-kit" className="text-fuchsia-500 hover:underline">
              Order a free sizing kit
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
