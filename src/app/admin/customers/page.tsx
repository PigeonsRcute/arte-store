import { createClient } from "@/lib/supabase/server";
import CustomersClient from "./CustomersClient";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, city, country, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const customers = profiles ?? [];

  const customerIds = customers.map((c) => c.id);
  const { data: orderCounts } = customerIds.length
    ? await supabase.from("orders").select("user_id").in("user_id", customerIds)
    : { data: [] };

  const countMap = (orderCounts ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.user_id] = (acc[o.user_id] ?? 0) + 1;
    return acc;
  }, {});

  const callerId = authData?.user?.id;
  let isOwner = false;
  if (callerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();
    isOwner = profile?.role === "owner";
  }

  return (
    <CustomersClient
      customers={customers}
      countMap={countMap}
      isOwner={isOwner}
    />
  );
}
