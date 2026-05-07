"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SparklesText } from "@/components/ui/sparkles-text";
import HeroBadge from "@/components/ui/HeroBadge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpForm() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email) errs.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsDuplicateEmail(false);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("already registered")) {
        setIsDuplicateEmail(true);
      } else {
        setServerError(msg || "Sign up failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 text-5xl">
          🎨
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-zinc-900">You&apos;re in!</h2>
          <p className="text-zinc-500">
            Check your email to confirm your account, then come back and sign in.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-cyan-400 px-8 py-3 font-black text-zinc-900 transition hover:bg-cyan-300"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Label + heading */}
      <div className="space-y-3">
        <HeroBadge icon={<Sparkles size={13} />} text="Join the studio" variant="outline" size="sm" />
        <SparklesText
          text="Sign Up"
          className="text-5xl font-black text-zinc-900"
          colors={{ first: "#06b6d4", second: "#ec4899" }}
          sparklesCount={6}
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Full name */}
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearFieldError("fullName"); }}
            placeholder="Your name"
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-cyan-400 ${fieldErrors.fullName ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.fullName && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
            placeholder="you@example.com"
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-cyan-400 ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.email && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
            placeholder="Min. 8 characters"
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-cyan-400 ${fieldErrors.password ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.password && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Server error */}
        {isDuplicateEmail && (
          <p className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            An account with this email already exists.{" "}
            <Link href="/login" className="underline hover:text-red-800">
              Sign in instead →
            </Link>
          </p>
        )}
        {serverError && (
          <p className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {serverError}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 text-base font-black text-zinc-900 transition active:scale-[0.98] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Link to sign in */}
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-black text-zinc-900 transition-colors hover:text-cyan-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
