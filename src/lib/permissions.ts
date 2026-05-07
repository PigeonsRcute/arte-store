import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRole, UserRole } from "@/lib/types";

// Ordered by specificity — first match wins.
// Pairs: [path prefix, section name]
const SECTION_ENTRIES: [string, string][] = [
  ["/admin/categories", "products"],
  ["/admin/revenue",    "analytics"],
  ["/admin/products",   "products"],
  ["/admin/homepage",   "homepage"],
  ["/admin/events",     "events"],
  ["/admin/orders",     "orders"],
  ["/admin/customers",  "customers"],
  ["/admin/reviews",    "reviews"],
  ["/admin/contact",    "contact"],
  ["/admin/shipping",   "shipping"],
  ["/admin/analytics",  "analytics"],
  ["/admin/team",       "team"],
  ["/admin/nails",      "nails"],
  ["/admin/settings",   "settings"],
  ["/admin",            "dashboard"],
];

export const ADMIN_ROLES: AdminRole[] = [
  "owner", "editor", "support", "viewer", "nails_admin",
];

export function getPathSection(pathname: string): string | null {
  for (const [prefix, section] of SECTION_ENTRIES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return section;
    }
  }
  // Exact /admin match (dashboard)
  if (pathname === "/admin") return "dashboard";
  return null;
}

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRole | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return (data?.role as UserRole) ?? null;
}

export async function canUserAccess(
  supabase: SupabaseClient,
  role: UserRole,
  section: string,
  action: "read" | "write",
): Promise<boolean> {
  if (role === "owner") return true;

  const { data } = await supabase
    .from("admin_permissions")
    .select("can_read, can_write")
    .eq("role", role)
    .eq("section", section)
    .single();

  if (!data) return false;
  return action === "read" ? data.can_read : data.can_write;
}

// Returns all sections a role can read — used by the sidebar to filter nav items.
export async function getReadableSections(
  supabase: SupabaseClient,
  role: UserRole,
): Promise<string[]> {
  if (role === "owner") {
    return SECTION_ENTRIES.map(([, section]) => section)
      .filter((s, i, arr) => arr.indexOf(s) === i); // dedupe
  }

  const { data } = await supabase
    .from("admin_permissions")
    .select("section")
    .eq("role", role)
    .eq("can_read", true);

  return data?.map((r: { section: string }) => r.section) ?? [];
}
