"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SparklesText } from "@/components/ui/sparkles-text";
import HeroBadge from "@/components/ui/HeroBadge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) errs.email = "Enter a valid email address.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const origin = window.location.origin;
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      // Always show success — avoids leaking whether the email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-4xl">
          📬
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-zinc-900">Check your inbox</h2>
          <p className="text-zinc-500">
            We sent a reset link to{" "}
            <span className="font-bold text-zinc-900">{email}</span>.
            It may take a minute.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-indigo-600 px-8 py-3 font-black text-white transition hover:bg-indigo-500"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Label + heading */}
      <div className="space-y-3">
        <HeroBadge icon={<Mail size={13} />} text="Reset your password" variant="outline" size="sm" />
        <SparklesText
          text="Forgot?"
          className="text-5xl font-black text-zinc-900"
          colors={{ first: "#6366f1", second: "#8b5cf6" }}
          sparklesCount={6}
        />
        <p className="text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }}
            placeholder="you@example.com"
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-indigo-400 ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.email && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-base font-black text-white transition active:scale-[0.98] hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending…
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      {/* Link back */}
      <p className="text-center text-sm text-zinc-500">
        Remembered it?{" "}
        <Link href="/login" className="font-black text-zinc-900 transition-colors hover:text-indigo-600">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
