import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SizingKitForm from "@/components/nails/SizingKitForm";

export default async function SizingKitSubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    redirect("/login?reason=signin_required&next=/nails/sizing-kit/submit");
  }

  const { method } = await searchParams;
  const sizingMethod: "physical" | "photo" = method === "photo" ? "photo" : "physical";

  const { data: existing } = await supabase
    .from("nail_sizing_submissions")
    .select("method, submitted_at")
    .eq("user_id", authData.user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div className="text-center">
        <p className="mb-1 text-xs font-bold tracking-widest text-violet-500">SIZING</p>
        <h1 className="text-4xl font-black text-zinc-800">
          {sizingMethod === "photo" ? "Upload Finger Photos" : "Submit Your Sizes"}
        </h1>
        <p className="mt-2 text-zinc-500">
          {sizingMethod === "photo"
            ? "One photo per finger, with a penny for scale. We'll measure and confirm your sizes."
            : "Select the best-fitting size for each finger using your kit."}
        </p>
      </div>

      {existing && (
        <div className="rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-200 text-sm text-violet-800">
          <p className="mb-1 font-bold">You already have sizing on file</p>
          <p className="text-violet-600">
            Last submitted via {existing.method} method on{" "}
            {new Date(existing.submitted_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            . Submitting again saves a new record.
          </p>
        </div>
      )}

      <SizingKitForm method={sizingMethod} />
    </div>
  );
}
