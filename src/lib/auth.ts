import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole, UserRole } from "@/lib/types";
import { ADMIN_ROLES } from "@/lib/permissions";

export async function getIsAdmin(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return ADMIN_ROLES.includes(data?.role as AdminRole);
}

// Requires the user to be authenticated with any admin role.
// Used by the admin layout — section-level checks happen in middleware.
export async function requireAnyAdminRole(): Promise<{ id: string; role: UserRole }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) {
    redirect("/login?reason=signin_required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role as AdminRole)) {
    redirect("/");
  }

  return { id: user.id, role: profile.role as UserRole };
}

// Requires a specific role — used by pages like /admin/team (owner only).
export async function requireRole(requiredRole: UserRole) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) {
    redirect("/login?reason=signin_required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== requiredRole) {
    redirect("/admin?error=access_denied");
  }

  return user;
}
