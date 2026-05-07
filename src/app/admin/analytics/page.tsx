export default async function AnalyticsPage() {

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-blue-200">
        <h1 className="text-2xl font-black text-blue-700">Analytics</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Visitor and traffic analytics will appear here once an analytics provider is connected
          (e.g. Vercel Analytics or Plausible).
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Page Views", value: "—", sub: "provider not connected" },
          { label: "Unique Visitors", value: "—", sub: "provider not connected" },
          { label: "Conversion Rate", value: "—", sub: "provider not connected" },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl bg-white/90 p-5 shadow-lg ring-2 ring-zinc-200"
          >
            <p className="text-sm font-semibold text-zinc-400">{label}</p>
            <p className="mt-1 text-4xl font-black text-zinc-300">{value}</p>
            <p className="mt-1 text-xs text-zinc-400">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
