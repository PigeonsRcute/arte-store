"use client";

import { useState, useTransition } from "react";
import { saveSection } from "./actions";
import type { HomepageContent, SaleEvent } from "@/lib/types";
import ImageUploadField from "@/components/admin/ImageUploadField";
import ProductPicker, { type PickerItem } from "@/components/admin/ProductPicker";
import HomepageEventPicker from "@/components/admin/HomepageEventPicker";

interface Props {
  sections: HomepageContent[];
  products: PickerItem[];
  saleEvents: SaleEvent[];
}

const TABS = [
  { key: "announcements",       label: "Announcements" },
  { key: "hero",                label: "Hero"          },
  { key: "promotions",          label: "Promotions"    },
  { key: "featured_products",   label: "Featured"      },
  { key: "events",              label: "Events"        },
  { key: "coming_soon",         label: "Coming Soon"   },
  { key: "footer",              label: "Footer"        },
] as const;

type TabKey = typeof TABS[number]["key"];

function Field({ label, name, value, onChange, multiline = false, hint }: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</label>
      {multiline ? (
        <textarea
          name={name} value={value} onChange={e => onChange(e.target.value)} rows={5}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      ) : (
        <input
          type="text" name={name} value={value} onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      )}
      {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-violet-500" : "bg-zinc-200"}`}
        onClick={() => onChange(!checked)}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
    </label>
  );
}

function SaveButton() {
  return (
    <button type="submit" className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-violet-500 active:scale-95">
      Save changes
    </button>
  );
}

// ── Per-section form components ──────────────────────────────────────────────

function AnnouncementsForm({ data, isActive, onSave }: { data: Record<string, unknown>; isActive: boolean; onSave: (d: Record<string, unknown>, a: boolean) => void }) {
  const [active, setActive]           = useState(isActive);
  const [text, setText]               = useState(String(data.text ?? ""));
  const [link, setLink]               = useState(String(data.link ?? ""));
  const [linkLabel, setLinkLabel]     = useState(String(data.link_label ?? ""));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ text, link, link_label: linkLabel }, active); }} className="space-y-5">
      <Toggle checked={active} onChange={setActive} label="Section visible" />
      <Field label="Announcement text" name="text" value={text} onChange={setText} />
      <Field label="Link URL (optional)" name="link" value={link} onChange={setLink} hint="e.g. /shop" />
      <Field label="Link label (optional)" name="link_label" value={linkLabel} onChange={setLinkLabel} hint="e.g. Shop now" />
      <SaveButton />
    </form>
  );
}

function HeroForm({ data, isActive, onSave }: { data: Record<string, unknown>; isActive: boolean; onSave: (d: Record<string, unknown>, a: boolean) => void }) {
  const [active, setActive]       = useState(isActive);
  const [headline, setHeadline]   = useState(String(data.headline ?? ""));
  const [sub, setSub]             = useState(String(data.subheadline ?? ""));
  const [ctaText, setCtaText]     = useState(String(data.cta_text ?? ""));
  const [ctaLink, setCtaLink]     = useState(String(data.cta_link ?? ""));
  const [bgImage, setBgImage]     = useState(String(data.bg_image_url ?? ""));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ headline, subheadline: sub, cta_text: ctaText, cta_link: ctaLink, bg_image_url: bgImage }, active); }} className="space-y-5">
      <Toggle checked={active} onChange={setActive} label="Section visible" />
      <Field label="Headline" name="headline" value={headline} onChange={setHeadline} hint="Two words recommended — first word gets outlined style, rest solid white" />
      <Field label="Subheadline" name="subheadline" value={sub} onChange={setSub} />
      <Field label="CTA button text" name="cta_text" value={ctaText} onChange={setCtaText} />
      <Field label="CTA link" name="cta_link" value={ctaLink} onChange={setCtaLink} hint="e.g. /shop" />
      <ImageUploadField label="Background / artwork image" value={bgImage} onChange={setBgImage} hint="Leave blank to show placeholder" />
      <SaveButton />
    </form>
  );
}

function PromotionsForm({ data, isActive, onSave, products }: {
  data: Record<string, unknown>; isActive: boolean;
  onSave: (d: Record<string, unknown>, a: boolean) => void;
  products: PickerItem[];
}) {
  const [active, setActive]         = useState(isActive);
  const [badge, setBadge]           = useState(String(data.badge_label ?? "SALE"));
  const [blurb, setBlurb]           = useState(String(data.blurb ?? ""));
  const [discount, setDiscount]     = useState(String(data.discount_text ?? ""));
  const [productIds, setProductIds] = useState<string[]>(
    Array.isArray(data.product_ids) ? (data.product_ids as string[]) : []
  );
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ badge_label: badge, blurb, discount_text: discount, product_ids: productIds }, active); }} className="space-y-5">
      <Toggle checked={active} onChange={setActive} label="Section visible" />
      <Field label="Badge label" name="badge_label" value={badge} onChange={setBadge} hint='e.g. SALE' />
      <Field label="Section blurb" name="blurb" value={blurb} onChange={setBlurb} />
      <Field label="Discount text" name="discount_text" value={discount} onChange={setDiscount} hint='e.g. Up to 30% off' />
      <ProductPicker label="Products (up to 4)" items={products} selectedIds={productIds} onChange={setProductIds} max={4} />
      <SaveButton />
    </form>
  );
}

function FeaturedForm({ data, isActive, onSave, products }: {
  data: Record<string, unknown>; isActive: boolean;
  onSave: (d: Record<string, unknown>, a: boolean) => void;
  products: PickerItem[];
}) {
  const [active, setActive]         = useState(isActive);
  const [headline, setHead]         = useState(String(data.headline ?? "New Releases"));
  const [productIds, setProductIds] = useState<string[]>(
    Array.isArray(data.product_ids) ? (data.product_ids as string[]) : []
  );
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ headline, product_ids: productIds }, active); }} className="space-y-5">
      <Toggle checked={active} onChange={setActive} label="Section visible" />
      <Field label="Section headline" name="headline" value={headline} onChange={setHead} />
      <ProductPicker label="Products (up to 6)" items={products} selectedIds={productIds} onChange={setProductIds} max={6} />
      <SaveButton />
    </form>
  );
}

function ComingSoonForm({ data, isActive, onSave }: { data: Record<string, unknown>; isActive: boolean; onSave: (d: Record<string, unknown>, a: boolean) => void }) {
  const [active, setActive] = useState(isActive);
  const [title, setTitle]   = useState(String(data.title ?? ""));
  const [date, setDate]     = useState(String(data.expected_date ?? ""));
  const [image, setImage]   = useState(String(data.teaser_image_url ?? ""));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ title, expected_date: date, teaser_image_url: image }, active); }} className="space-y-5">
      <Toggle checked={active} onChange={setActive} label="Section visible" />
      <Field label="Title" name="title" value={title} onChange={setTitle} />
      <Field label="Expected date" name="expected_date" value={date} onChange={setDate} hint='e.g. Summer 2026' />
      <ImageUploadField label="Teaser image" value={image} onChange={setImage} hint="Leave blank for animated placeholder" />
      <SaveButton />
    </form>
  );
}

function FooterForm({ data, isActive, onSave }: { data: Record<string, unknown>; isActive: boolean; onSave: (d: Record<string, unknown>, a: boolean) => void }) {
  const [active, setActive]       = useState(isActive);
  const [tagline, setTagline]     = useState(String(data.tagline ?? ""));
  const [shopLink, setShopLink]   = useState(String(data.shop_link ?? "/shop"));
  const [contactLink, setContact] = useState(String(data.contact_link ?? "/contact"));
  const [socialJson, setSocial]   = useState(() => JSON.stringify(data.social_links ?? [], null, 2));
  const [jsonError, setJsonError] = useState("");

  const handleSocialChange = (v: string) => {
    setSocial(v);
    try { JSON.parse(v); setJsonError(""); } catch { setJsonError("Invalid JSON"); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const social_links = JSON.parse(socialJson);
      onSave({ tagline, shop_link: shopLink, contact_link: contactLink, social_links }, active);
    } catch { setJsonError("Fix JSON before saving"); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Toggle checked={active} onChange={setActive} label="Section visible" />
      <Field label="Tagline" name="tagline" value={tagline} onChange={setTagline} />
      <Field label="Shop link" name="shop_link" value={shopLink} onChange={setShopLink} />
      <Field label="Contact link" name="contact_link" value={contactLink} onChange={setContact} />
      <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500">Social links (JSON array)</label>
        <textarea
          value={socialJson} onChange={e => handleSocialChange(e.target.value)} rows={6}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
        <p className="text-[11px] text-zinc-400">Each item: {"{ label, href }"}</p>
      </div>
      <SaveButton />
    </form>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────
export default function HomepageEditor({ sections, products, saleEvents }: Props) {
  const [activeTab, setActiveTab]   = useState<TabKey>("hero");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved]           = useState<string | null>(null);

  const byKey = Object.fromEntries(sections.map(s => [s.section, s]));

  const getSection = (key: string): HomepageContent =>
    byKey[key] ?? { id: "", section: key, content: {}, is_active: false, updated_at: "" };

  const handleSave = (key: string) => (data: Record<string, unknown>, isActive: boolean) => {
    startTransition(async () => {
      await saveSection(key, data, isActive);
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    });
  };

  const s = getSection(activeTab);

  const formMap: Record<TabKey, React.ReactNode> = {
    announcements:    <AnnouncementsForm data={s.content} isActive={s.is_active} onSave={handleSave("announcements")} />,
    hero:             <HeroForm          data={s.content} isActive={s.is_active} onSave={handleSave("hero")} />,
    promotions:       <PromotionsForm    data={s.content} isActive={s.is_active} onSave={handleSave("promotions")}    products={products} />,
    featured_products:<FeaturedForm      data={s.content} isActive={s.is_active} onSave={handleSave("featured_products")} products={products} />,
    events:           <HomepageEventPicker events={saleEvents} data={s.content} isActive={s.is_active} onSave={handleSave("events")} />,
    coming_soon:      <ComingSoonForm    data={s.content} isActive={s.is_active} onSave={handleSave("coming_soon")} />,
    footer:           <FooterForm        data={s.content} isActive={s.is_active} onSave={handleSave("footer")} />,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const sec = getSection(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative rounded-full px-4 py-2 text-sm font-bold transition ${
                isActive ? "bg-violet-600 text-white shadow" : "bg-white text-zinc-600 hover:bg-zinc-100 ring-1 ring-zinc-200"
              }`}
            >
              {tab.label}
              <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-50 ${sec.is_active ? "bg-emerald-400" : "bg-zinc-300"}`} />
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-zinc-50 p-6 ring-1 ring-zinc-200">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-zinc-900">
            {TABS.find(t => t.key === activeTab)?.label}
          </h2>
          {saved === activeTab && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">✓ Saved</span>
          )}
          {isPending && (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">Saving…</span>
          )}
        </div>
        {formMap[activeTab]}
      </div>

      <p className="text-xs text-zinc-400">
        Changes are reflected on the public homepage immediately — no redeploy needed.
        Green dot = visible. Grey dot = hidden.
      </p>
    </div>
  );
}
