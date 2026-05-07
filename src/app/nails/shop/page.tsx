import { createClient } from "@/lib/supabase/server";
import NailCard from "@/components/nails/NailCard";
import { SparklesText } from "@/components/ui/sparkles-text";
import type { NailProduct, NailShape, NailFinish } from "@/lib/types";

const SHAPES: Array<{ value: NailShape | "all"; label: string }> = [
  { value: "all", label: "All shapes" },
  { value: "coffin", label: "Coffin" },
  { value: "almond", label: "Almond" },
  { value: "square", label: "Square" },
  { value: "stiletto", label: "Stiletto" },
  { value: "oval", label: "Oval" },
  { value: "ballerina", label: "Ballerina" },
];

const FINISHES: Array<{ value: NailFinish | "all"; label: string }> = [
  { value: "all",               label: "All finishes" },
  { value: "glossy_top_coat",   label: "Glossy top coat" },
  { value: "matte_top_coat",    label: "Matte top coat" },
  { value: "glittery_top_coat", label: "Glittery top coat" },
  { value: "silvery_top_coat",  label: "Silvery top coat" },
];

interface SearchParams {
  shape?: string;
  finish?: string;
}

export default async function NailsShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { shape, finish } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("nail_products")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (shape && shape !== "all") query = query.eq("shape", shape);
  if (finish && finish !== "all") query = query.eq("finish", finish);

  const { data } = await query;
  const products = (data ?? []) as NailProduct[];

  const activeShape = shape ?? "all";
  const activeFinish = finish ?? "all";

  function filterHref(params: Partial<SearchParams>) {
    const p = new URLSearchParams();
    const merged = { shape: activeShape, finish: activeFinish, ...params };
    if (merged.shape && merged.shape !== "all") p.set("shape", merged.shape);
    if (merged.finish && merged.finish !== "all") p.set("finish", merged.finish);
    const qs = p.toString();
    return `/nails/shop${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="text-center">
        <p className="mb-1 text-xs font-bold tracking-widest text-fuchsia-400">PRESS-ON SETS</p>
        <SparklesText
          text="Shop the Collection"
          className="text-4xl font-black text-zinc-800"
          colors={{ first: "#c084fc", second: "#f472b6" }}
          sparklesCount={8}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {SHAPES.map(({ value, label }) => (
            <a
              key={value}
              href={filterHref({ shape: value })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeShape === value
                  ? "bg-fuchsia-500 text-white"
                  : "bg-white/70 text-zinc-600 ring-1 ring-pink-200 hover:ring-fuchsia-300"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {FINISHES.map(({ value, label }) => (
            <a
              key={value}
              href={filterHref({ finish: value })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeFinish === value
                  ? "bg-violet-500 text-white"
                  : "bg-white/70 text-zinc-600 ring-1 ring-pink-200 hover:ring-violet-300"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Grid */}
      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <NailCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/60 py-24 text-center ring-1 ring-pink-100">
          <span className="text-5xl">💅</span>
          <p className="font-semibold text-zinc-500">
            {activeShape !== "all" || activeFinish !== "all"
              ? "No sets match these filters yet."
              : "No sets published yet — check back soon."}
          </p>
          {(activeShape !== "all" || activeFinish !== "all") && (
            <a
              href="/nails/shop"
              className="rounded-full border border-fuchsia-200 px-5 py-2 text-sm font-semibold text-fuchsia-700 hover:bg-fuchsia-50"
            >
              Clear filters
            </a>
          )}
        </div>
      )}
    </div>
  );
}
