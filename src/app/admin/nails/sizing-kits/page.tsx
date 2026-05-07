import { requireAnyAdminRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NailSizingSubmission } from "@/lib/types";

const FINGERS = [
  "Thumb L", "Index L", "Middle L", "Ring L", "Pinky L",
  "Thumb R", "Index R", "Middle R", "Ring R", "Pinky R",
];

type SubmissionRow = NailSizingSubmission & {
  profiles: { full_name: string | null; email: string | null } | null;
};

export default async function AdminSizingKitsPage() {
  await requireAnyAdminRole();
  const supabase = await createClient();

  const { data: subData, error } = await supabase
    .from("nail_sizing_submissions")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) console.error("[admin/nails/sizing-kits]", error.message, error.details);

  const rawSubs = (subData ?? []) as NailSizingSubmission[];

  const userIds = [...new Set(rawSubs.map((s) => s.user_id))];
  const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, { full_name: p.full_name as string | null, email: p.email as string | null });
    }
  }

  const submissions = rawSubs.map((s) => ({ ...s, profiles: profileMap.get(s.user_id) ?? null })) as SubmissionRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Sizing Submissions</h1>
        <p className="text-sm text-zinc-500">Per-finger measurements submitted by customers.</p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-zinc-200">
          <p className="text-zinc-400">No sizing submissions yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-zinc-800">{s.profiles?.full_name ?? "—"}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        s.method === "photo"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {s.method === "photo" ? "Photo" : "Physical kit"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{s.profiles?.email ?? ""}</p>
                </div>
                <p className="text-xs text-zinc-400">
                  {new Date(s.submitted_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {s.method === "photo" ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {FINGERS.map((finger, i) => {
                    const url = s.photo_urls?.[i];
                    return (
                      <div
                        key={finger}
                        className="flex flex-col items-center gap-1 rounded-xl bg-zinc-50 p-2"
                      >
                        <span className="text-[10px] font-bold text-zinc-400">{finger}</span>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={finger}
                              className="h-16 w-16 rounded-lg object-cover ring-1 ring-pink-100 hover:ring-fuchsia-300 transition"
                            />
                          </a>
                        ) : (
                          <span className="text-sm font-bold text-zinc-300">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-sm">
                  {FINGERS.map((finger) => (
                    <div
                      key={finger}
                      className={`flex flex-col items-center rounded-xl p-2 ${
                        (s.sizes as Record<string, string>)[finger]
                          ? "bg-violet-50 ring-1 ring-violet-100"
                          : "bg-zinc-50"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-zinc-400">{finger}</span>
                      <span className="font-black text-violet-700">
                        {(s.sizes as Record<string, string>)[finger] || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
