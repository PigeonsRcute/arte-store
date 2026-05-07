import Link from "next/link";

const PHYSICAL_STEPS = [
  { n: "01", title: "Order the kit", body: "Add the sizing kit to your cart and check out. It ships to you — a small set of sample nails in every size." },
  { n: "02", title: "Try each size", body: "Press each sample onto each finger and note which fits best. The fit should feel snug but comfortable." },
  { n: "03", title: "Submit your sizes", body: "Come back to this page and click \"I have my kit — submit sizes\" to log your per-finger measurements." },
  { n: "04", title: "Order with confidence", body: "Every future order uses your saved sizes. No guesswork, no returns." },
];

const PHOTO_STEPS = [
  { n: "01", title: "Get a penny", body: "Grab any penny (or similar small coin). It gives us a consistent scale reference across all photos." },
  { n: "02", title: "Photograph each finger", body: "Place the coin flat next to your finger, touching the base of the nail. Shoot straight down with good lighting." },
  { n: "03", title: "Upload the photos", body: "Submit all 10 photos (one per finger) using the form. We'll measure and save your sizes." },
  { n: "04", title: "We confirm your sizes", body: "We review the photos and message you with your confirmed measurements before any order ships." },
];

export default function SizingKitPage() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 px-10 py-16 text-center ring-1 ring-violet-200">
        <p className="mb-2 text-xs font-bold tracking-widest text-violet-500">GET YOUR FIT RIGHT</p>
        <h1 className="mb-4 text-5xl font-black text-zinc-800">Find Your Size</h1>
        <p className="mx-auto max-w-md text-lg text-zinc-600">
          Two ways to nail the perfect fit. Choose the one that works for you.
        </p>
      </section>

      {/* Two options */}
      <section className="grid gap-8 lg:grid-cols-2">

        {/* Option A — Physical Kit */}
        <div className="flex flex-col gap-6 rounded-3xl bg-white p-8 ring-1 ring-violet-200 shadow-sm">
          <div>
            <span className="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-600">
              Option A · Paid
            </span>
            <h2 className="text-2xl font-black text-zinc-800">Physical Sizing Kit</h2>
            <p className="mt-2 text-zinc-500">
              Order a physical kit — a set of sample press-on nails in every size. Try them on,
              find your perfect fit per finger, then submit your sizes.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {PHYSICAL_STEPS.map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <span className="mt-0.5 shrink-0 text-lg font-black text-violet-300">{n}</span>
                <div>
                  <p className="font-bold text-zinc-800">{title}</p>
                  <p className="text-sm leading-relaxed text-zinc-500">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            {/* TODO: update href to the actual sizing kit product slug once created */}
            <Link
              href="/nails/shop"
              className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-3 text-center font-bold text-white shadow-lg shadow-violet-200 transition hover:scale-105"
            >
              Order a physical sizing kit →
            </Link>
            <Link
              href="/nails/sizing-kit/submit"
              className="rounded-full border-2 border-violet-200 px-8 py-3 text-center font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              I have my kit — submit sizes
            </Link>
          </div>
        </div>

        {/* Option B — Free Photo Method */}
        <div className="flex flex-col gap-6 rounded-3xl bg-white p-8 ring-1 ring-pink-200 shadow-sm">
          <div>
            <span className="mb-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              Option B · Free
            </span>
            <h2 className="text-2xl font-black text-zinc-800">Free Photo Method</h2>
            <p className="mt-2 text-zinc-500">
              No kit, no shipping. Upload a photo of each finger alongside a penny for scale —
              we measure from the photos and save your sizes.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {PHOTO_STEPS.map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <span className="mt-0.5 shrink-0 text-lg font-black text-pink-300">{n}</span>
                <div>
                  <p className="font-bold text-zinc-800">{title}</p>
                  <p className="text-sm leading-relaxed text-zinc-500">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-2">
            <Link
              href="/nails/sizing-kit/submit?method=photo"
              className="block rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-8 py-3 text-center font-bold text-white shadow-lg shadow-pink-200 transition hover:scale-105"
            >
              Upload finger photos →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-zinc-800">FAQ</h2>
        </div>
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          {[
            {
              q: "Which method is more accurate?",
              a: "The physical kit is more reliable — you're testing actual nail pieces on your fingers. The photo method is a good fallback when you want a quick, free option.",
            },
            {
              q: "Can I do both?",
              a: "Yes. We keep the most accurate submission on file. If you order a kit later, your photo-based sizes will be replaced.",
            },
            {
              q: "I already know my sizes — do I need this?",
              a: "Not at all. You can submit sizes manually during checkout or directly on the submit page.",
            },
            {
              q: "How long does the kit take to arrive?",
              a: "Usually 3–7 business days depending on your location.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-2xl bg-white/70 p-6 ring-1 ring-pink-100">
              <p className="mb-2 font-black text-zinc-800">{q}</p>
              <p className="text-sm leading-relaxed text-zinc-600">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
