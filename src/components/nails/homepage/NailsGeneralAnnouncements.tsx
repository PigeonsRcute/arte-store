import type { NailGeneralAnnouncementsContent } from "@/lib/types";

interface Props {
  content: NailGeneralAnnouncementsContent;
}

export default function NailsGeneralAnnouncements({ content }: Props) {
  const items = content.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {items.map(item => (
          <div
            key={item.id}
            className="rounded-2xl border-2 border-violet-100 bg-white px-6 py-5 shadow-sm"
          >
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-400">
              Announcement
            </p>
            <h3 className="mb-2 text-lg font-black text-zinc-900">{item.title}</h3>
            <p className="text-sm leading-relaxed text-zinc-600">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
