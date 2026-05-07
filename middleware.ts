import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getPathSection } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

const ADMIN_ROLES: UserRole[] = ["owner", "editor", "support", "viewer", "nails_admin"];

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return response;

  // Not authenticated → login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("reason", "signin_required");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Fetch role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole | null;

  // Customer or missing profile → back to login
  if (!role || !ADMIN_ROLES.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("reason", "signin_required");
    return NextResponse.redirect(url);
  }

  // Owner bypasses all section checks
  if (role === "owner") return response;

  // Editors land on /admin/products, not the dashboard
  if (role === "editor" && pathname === "/admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/products";
    return NextResponse.redirect(url);
  }

  // Determine which section this path belongs to
  const section = getPathSection(pathname);

  // Unknown section (e.g. new pages not yet mapped) — pass through
  if (!section) return response;

  // Check read permission for this section
  const { data: perm } = await supabase
    .from("admin_permissions")
    .select("can_read")
    .eq("role", role)
    .eq("section", section)
    .single();

  if (!perm?.can_read) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("section", section);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
