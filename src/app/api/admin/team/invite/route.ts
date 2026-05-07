import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminRole } from "@/lib/types";

const INVITABLE_ROLES: AdminRole[] = ["editor", "support", "viewer", "nails_admin"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email: string = body?.email?.trim()?.toLowerCase();
  const full_name: string = body?.full_name?.trim();
  const role: AdminRole = body?.role;
  const message: string | undefined = body?.message?.trim() || undefined;

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  if (!full_name) return NextResponse.json({ error: "Full name required" }, { status: 400 });
  if (!role || !INVITABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const inviteOptions = message
    ? { data: { invite_message: message } }
    : undefined;

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, inviteOptions);

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  // The on_auth_user_created trigger fires immediately and sets role = 'customer'.
  // Override with the chosen role and name so the pending invite shows correctly.
  await adminClient
    .from("profiles")
    .update({ role, full_name })
    .eq("id", inviteData.user.id);

  return NextResponse.json({ ok: true });
}
