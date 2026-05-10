import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_RATES, type Rates } from "@/lib/currency";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "currency_fallback_rates")
    .single();

  let rates: Rates = FALLBACK_RATES;
  if (data?.value) {
    try {
      rates = { ...FALLBACK_RATES, ...JSON.parse(data.value as string) };
    } catch {
      // use hardcoded defaults
    }
  }

  return NextResponse.json(rates, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
