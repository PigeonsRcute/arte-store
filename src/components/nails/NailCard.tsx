import Link from "next/link";
import type { NailProduct, SalePrice } from "@/lib/types";

interface Props {
  product: NailProduct;
  salePrice?: SalePrice;
}

const SHAPE_LABEL: Record<string, string> = {
  coffin: "Coffin", almond: "Almond", square: "Square",
  stiletto: "Stiletto", oval: "Oval", ballerina: "Ballerina",
};

const FINISH_LABEL: Record<string, string> = {
  glossy: "Glossy", matte: "Matte", chrome: "Chrome",
  holographic: "Holo ✦", velvet: "Velvet",
};

const FINISH_PILL: Record<string, string> = {
  glossy: "bg-pink-100 text-pink-700",
  matte: "bg-zinc-100 text-zinc-600",
  chrome: "bg-slate-100 text-slate-600",
  holographic: "bg-gradient-to-r from-fuchsia-100 to-violet-100 text-fuchsia-700",
  velvet: "bg-purple-100 text-purple-700",
};

export default function NailCard({ product, salePrice }: Props) {
  const img = product.images[0];
  const price = (product.price_cents / 100).toFixed(2);
  const finishPill = FINISH_PILL[product.finish] ?? "bg-zinc-100 text-zinc-600";

  return (
    <Link
      href={`/nails/shop/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-pink-100 backdrop-blur transition hover:shadow-lg hover:ring-fuchsia-200"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">💅</div>
        )}
        {salePrice && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
            SALE
          </span>
        )}
        <div className="absolute inset-0 rounded-none opacity-0 ring-2 ring-inset ring-fuchsia-300 transition group-hover:opacity-100" />
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-bold text-zinc-800 transition group-hover:text-fuchsia-700">
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-semibold text-pink-600">
            {SHAPE_LABEL[product.shape] ?? product.shape}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${finishPill}`}>
            {FINISH_LABEL[product.finish] ?? product.finish}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex flex-wrap items-baseline gap-1.5">
            {salePrice ? (
              <>
                <span className="text-lg font-black text-red-600">
                  ${(salePrice.sale_cents / 100).toFixed(2)}
                </span>
                <span className="text-sm font-bold text-zinc-400 line-through">${price}</span>
              </>
            ) : (
              <span className="text-lg font-black text-zinc-900">${price}</span>
            )}
          </div>
          {product.stock_qty === 0 ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400">
              Sold out
            </span>
          ) : (
            <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs font-semibold text-fuchsia-600 opacity-0 transition group-hover:opacity-100">
              View →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
