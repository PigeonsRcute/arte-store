"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SparklesText } from "@/components/ui/sparkles-text";
import HeroBadge from "@/components/ui/HeroBadge";

interface SignInFormProps {
  reason?: string;
  next?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInForm({ reason, next }: SignInFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next ?? "/account");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Label + heading */}
      <div className="space-y-3">
        <HeroBadge icon={<Lock size={13} />} text="Welcome back" variant="outline" size="sm" />
        <SparklesText
          text="Sign In"
          className="text-5xl font-black text-zinc-900"
          colors={{ first: "#f59e0b", second: "#ec4899" }}
          sparklesCount={6}
        />
      </div>

      {/* Reason banner */}
      {reason === "signin_required" && (
        <p className="rounded-xl border-2 border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-800">
          Please sign in to continue.
        </p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-yellow-400 ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.email && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-yellow-600 transition-colors hover:text-yellow-500"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
            placeholder="••••••••"
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-yellow-400 ${fieldErrors.password ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.password && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <p className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {serverError}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-4 text-base font-black text-zinc-900 transition active:scale-[0.98] hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Link to sign up */}
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-black text-zinc-900 transition-colors hover:text-yellow-600">
          Create one
        </Link>
      </p>
    </div>
  );
}
