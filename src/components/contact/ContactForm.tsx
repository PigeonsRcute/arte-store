"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SUBJECTS = [
  "General Enquiry",
  "Commission",
  "Wholesale",
  "Other",
] as const;

type Subject = (typeof SUBJECTS)[number];

interface FormState {
  name: string;
  email: string;
  subject: Subject;
  message: string;
}

const SPARKS = [
  { top: "-1rem", left: "50%", delay: "0ms",   color: "#FFD600" },
  { top: "10%",  left: "85%", delay: "60ms",  color: "#FF3B6B" },
  { top: "40%",  left: "95%", delay: "120ms", color: "#3B82F6" },
  { top: "80%",  left: "85%", delay: "180ms", color: "#FFD600" },
  { top: "95%",  left: "50%", delay: "240ms", color: "#FF3B6B" },
  { top: "80%",  left: "15%", delay: "300ms", color: "#10B981" },
  { top: "40%",  left: "5%",  delay: "360ms", color: "#FFD600" },
  { top: "10%",  left: "15%", delay: "420ms", color: "#3B82F6" },
];

export default function ContactForm() {
  const supabase = createClient();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "General Enquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: dbError } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject,
      message: form.message.trim(),
    });

    if (dbError) {
      setError("Something went wrong. Please try again.");
      console.error("[contact-form insert]", dbError);
      setSubmitting(false);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="relative flex flex-col items-center gap-6 py-20 text-center overflow-visible">
        {/* Sparkle burst */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="absolute text-2xl animate-ping"
              style={{
                top: s.top,
                left: s.left,
                animationDelay: s.delay,
                animationDuration: "1.2s",
                color: s.color,
                transform: "translate(-50%, -50%)",
              }}
            >
              ✦
            </span>
          ))}
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-black bg-[#FFD600] text-5xl shadow-[6px_6px_0px_#000]">
            ✉
          </div>
        </div>

        <div>
          <h2
            className="text-4xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Message sent!
          </h2>
          <p className="mt-2 text-lg text-zinc-500">
            Thanks for reaching out — I&apos;ll get back to you soon.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", subject: "General Enquiry", message: "" });
          }}
          className="rounded-full border-2 border-black px-6 py-2 text-sm font-bold shadow-[3px_3px_0px_#000] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">
            Full name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className="rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-medium shadow-[3px_3px_0px_#000] outline-none transition placeholder:text-zinc-400 focus:shadow-[5px_5px_0px_#FFD600]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="your@email.com"
            className="rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-medium shadow-[3px_3px_0px_#000] outline-none transition placeholder:text-zinc-400 focus:shadow-[5px_5px_0px_#FFD600]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">
          Subject
        </label>
        <select
          value={form.subject}
          onChange={(e) => set("subject", e.target.value as Subject)}
          className="rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-medium shadow-[3px_3px_0px_#000] outline-none transition focus:shadow-[5px_5px_0px_#FFD600]"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">
          Message
        </label>
        <textarea
          required
          rows={6}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell me what's on your mind..."
          className="resize-none rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-medium shadow-[3px_3px_0px_#000] outline-none transition placeholder:text-zinc-400 focus:shadow-[5px_5px_0px_#FFD600]"
        />
      </div>

      {error && (
        <p className="rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-full border-2 border-black bg-[#FFD600] px-8 py-3 font-black shadow-[4px_4px_0px_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send message →"}
      </button>
    </form>
  );
}
