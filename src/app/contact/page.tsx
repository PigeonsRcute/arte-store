import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Get in Touch — Pigeon's Artillery",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl py-8">
      {/* Header */}
      <div className="mb-10">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
          Contact
        </p>
        <h1
          className="text-5xl font-black leading-tight tracking-tight text-[#1A1A1A]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Get in Touch
        </h1>
        <p className="mt-4 text-lg text-zinc-500">
          Commissions, wholesale inquiries, or just want to say hello — I read every message.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_#000]">
        <ContactForm />
      </div>

      {/* Sidebar info */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-black bg-[#FFD600] p-5 shadow-[4px_4px_0px_#000]">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Response time</p>
          <p className="mt-1 text-lg font-black text-[#1A1A1A]">Within 48 hours</p>
        </div>
        <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000]">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Commission slots</p>
          <p className="mt-1 text-lg font-black text-[#1A1A1A]">Open — ask away</p>
        </div>
      </div>
    </section>
  );
}
