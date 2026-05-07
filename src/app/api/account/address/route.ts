import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { full_name, street, city, postal_code, country } = body as Record<string, string | null>;

  // Normalize country to uppercase ISO code so zone lookups always match.
  const normalizedCountry = country ? country.trim().toUpperCase() : null;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, street, city, postal_code, country: normalizedCountry })
    .eq("id", authData.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
