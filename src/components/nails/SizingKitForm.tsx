"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FINGERS = [
  "Thumb L", "Index L", "Middle L", "Ring L", "Pinky L",
  "Thumb R", "Index R", "Middle R", "Ring R", "Pinky R",
];
const SIZES = ["XS", "S", "M", "L", "XL"];

interface Props {
  method: "physical" | "photo";
}

export default function SizingKitForm({ method }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filledSizes = FINGERS.filter((f) => sizes[f]).length;
  const uploadedPhotos = FINGERS.filter((f) => photos[f]).length;
  const canSubmit = method === "physical" ? filledSizes > 0 : uploadedPhotos > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push("/login?reason=signin_required&next=/nails/sizing-kit/submit");
      return;
    }

    if (method === "photo") {
      // Upload each finger photo in FINGERS order; empty string for missing fingers.
      const photoUrls: string[] = [];
      for (const finger of FINGERS) {
        const file = photos[finger];
        if (file) {
          const ext = file.name.split(".").pop() ?? "jpg";
          const path = `sizing/${authData.user.id}/${Date.now()}-${finger.replace(/ /g, "_")}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("nail-references")
            .upload(path, file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("nail-references").getPublicUrl(path);
            photoUrls.push(urlData.publicUrl);
          } else {
            photoUrls.push("");
          }
        } else {
          photoUrls.push("");
        }
      }

      const { error } = await supabase.from("nail_sizing_submissions").insert({
        user_id: authData.user.id,
        method: "photo",
        photo_urls: photoUrls,
        sizes: {},
      });
      if (error) {
        console.error("[sizing-kit photo submit]", error);
        setErrorMsg(error.message);
        setStatus("error");
        return;
      }
    } else {
      const { error } = await supabase.from("nail_sizing_submissions").insert({
        user_id: authData.user.id,
        method: "physical",
        sizes,
        photo_urls: [],
      });
      if (error) {
        console.error("[sizing-kit physical submit]", error);
        setErrorMsg(error.message);
        setStatus("error");
        return;
      }
    }

    setStatus("done");
    setTimeout(() => router.push("/nails/orders"), 1500);
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-10 text-center ring-1 ring-violet-200">
        <p className="mb-4 text-5xl">💅</p>
        <h2 className="mb-2 text-2xl font-black text-zinc-800">
          {method === "photo" ? "Photos submitted!" : "Sizes saved!"}
        </h2>
        <p className="text-zinc-500">
          {method === "photo"
            ? "We'll review your photos and confirm your sizes. Redirecting…"
            : "We've got your measurements on file. Redirecting…"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {method === "physical" ? (
        <div className="rounded-2xl bg-white/80 p-6 ring-1 ring-pink-100">
          <p className="mb-4 text-xs font-bold tracking-widest text-fuchsia-400">
            {filledSizes} / {FINGERS.length} fingers filled
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FINGERS.map((finger) => (
              <div key={finger}>
                <label className="mb-1 block text-xs font-bold text-zinc-500">{finger}</label>
                <select
                  value={sizes[finger] ?? ""}
                  onChange={(e) => setSizes((prev) => ({ ...prev, [finger]: e.target.value }))}
                  className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-semibold focus:border-fuchsia-400 focus:outline-none"
                >
                  <option value="">—</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {filledSizes < FINGERS.length && (
            <p className="mt-4 text-center text-sm text-zinc-400">
              You can submit partial sizes — just fill in what you know.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 rounded-2xl bg-white/80 p-6 ring-1 ring-pink-100">
          <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100 text-sm text-amber-800">
            <p className="mb-1 font-bold">How to photograph your fingers</p>
            <p>
              Place a penny flat next to your finger, touching the base of the nail. Shoot
              straight down — full nail visible, good lighting. One photo per finger.
            </p>
          </div>

          <p className="text-xs font-bold tracking-widest text-fuchsia-400">
            {uploadedPhotos} / {FINGERS.length} photos added
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {FINGERS.map((finger) => {
              const file = photos[finger];
              return (
                <div key={finger} className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-zinc-500">{finger}</span>
                  <label
                    className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition ${
                      file
                        ? "border-fuchsia-400 bg-fuchsia-50"
                        : "border-pink-200 bg-white hover:border-fuchsia-200"
                    }`}
                  >
                    {file ? (
                      <>
                        <span className="text-xl">✓</span>
                        <span className="w-full truncate px-2 text-center text-[10px] font-semibold text-fuchsia-600">
                          {file.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl text-zinc-300">📷</span>
                        <span className="text-xs text-zinc-400">Add photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setPhotos((prev) => ({ ...prev, [finger]: f }));
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-zinc-400">
            You can upload photos for just the fingers you have — not all 10 are required.
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-200">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || status === "submitting"}
        className="w-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.02] disabled:opacity-40"
      >
        {status === "submitting"
          ? "Saving…"
          : method === "photo"
          ? "Submit photos"
          : "Save my sizes"}
      </button>
    </form>
  );
}
