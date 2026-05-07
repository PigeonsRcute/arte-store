import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import TeamClient from "@/app/admin/team/TeamClient";
import type { AdminRole } from "@/lib/types";

export default async function TeamPage() {
  await requireRole("owner");

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Fetch all profiles with an admin role
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .in("role", ["owner", "editor", "support", "viewer", "nails_admin"])
    .order("role");

  // Fetch auth.users to get last_sign_in_at — requires service role
  const { data: authUsers } = await adminClient.auth.admin.listUsers();

  const authMap = new Map(
    authUsers?.users?.map((u) => [u.id, u.last_sign_in_at || null]) ?? [],
  );

  const members = (profiles ?? []).map((p) => ({
    id: p.id as string,
    email: p.email as string,
    full_name: p.full_name as string | null,
    role: p.role as AdminRole,
    last_sign_in_at: authMap.get(p.id) ?? null,
  }));

  const { data: { user } } = await supabase.auth.getUser();

  return <TeamClient members={members} currentUserId={user!.id} />;
}
