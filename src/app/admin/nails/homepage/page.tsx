import { createClient } from "@/lib/supabase/server";
import NailsHomepageEditor from "./NailsHomepageEditor";
import type { NailHomepageContent } from "@/lib/types";

export const metadata = { title: "Nails Homepage Editor — Admin" };

export default async function AdminNailsHomepagePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nail_homepage_content")
    .select("*")
    .order("section");

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700 text-sm">
        Failed to load nails homepage content: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Nails Homepage Editor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edit each section&apos;s content and toggle visibility. Saves instantly — no redeploy needed.
        </p>
      </div>
      <NailsHomepageEditor sections={(data ?? []) as NailHomepageContent[]} />
    </div>
  );
}
