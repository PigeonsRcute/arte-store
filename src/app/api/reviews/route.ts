import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { product_id: string; order_id?: string; rating: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { product_id, order_id, rating, comment } = body;

  if (!product_id || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "product_id and a rating between 1–5 are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      product_id,
      order_id: order_id ?? null,
      rating,
      comment: comment?.trim() || null,
    })
    .select("id, product_id, user_id, order_id, rating, comment, created_at, profiles(full_name)")
    .single();

  if (error) {
    // Unique violation — user already reviewed this product
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
