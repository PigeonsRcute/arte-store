import { createClient } from "@/lib/supabase/server";
import HomepageEditor from "./HomepageEditor";
import type { HomepageContent } from "@/lib/types";

export const metadata = { title: "Homepage Editor — Admin" };

export default async function AdminHomepagePage() {
  const supabase = await createClient();

  // Admin RLS policy returns all rows (active + inactive) for authenticated admins
  const { data, error } = await supabase
    .from("homepage_content")
    .select("*")
    .order("section");

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700 text-sm">
        Failed to load homepage content: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Homepage Editor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edit each section&apos;s content and toggle visibility. Saves instantly — no redeploy needed.
        </p>
      </div>
      <HomepageEditor sections={(data ?? []) as HomepageContent[]} />
    </div>
  );
}
