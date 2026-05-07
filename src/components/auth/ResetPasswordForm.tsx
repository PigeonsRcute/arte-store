"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SparklesText } from "@/components/ui/sparkles-text";
import HeroBadge from "@/components/ui/HeroBadge";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!password) errs.password = "New password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!confirm) errs.confirm = "Please confirm your new password.";
    else if (password && confirm !== password) errs.confirm = "Passwords do not match.";
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // Redirect after a short pause so the success state is visible
      setTimeout(() => router.push("/account"), 2500);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-4xl">
          🔓
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-zinc-900">Password updated!</h2>
          <p className="text-zinc-500">Redirecting you to your account…</p>
        </div>
        <Link
          href="/account"
          className="inline-block rounded-xl bg-violet-600 px-8 py-3 font-black text-white transition hover:bg-violet-500"
        >
          Go to Account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Label + heading */}
      <div className="space-y-3">
        <HeroBadge icon={<KeyRound size={13} />} text="Set new password" variant="outline" size="sm" />
        <SparklesText
          text="New Password"
          className="text-5xl font-black text-zinc-900"
          colors={{ first: "#6366f1", second: "#8b5cf6" }}
          sparklesCount={6}
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* New password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-zinc-400">
            New Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
            placeholder="Min. 8 characters"
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-violet-500 ${fieldErrors.password ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.password && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Confirm Password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); clearFieldError("confirm"); }}
            placeholder="Repeat your password"
            className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition focus:border-violet-500 ${fieldErrors.confirm ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {fieldErrors.confirm && (
            <p className="text-sm font-bold text-red-500">{fieldErrors.confirm}</p>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-4 text-base font-black text-white transition active:scale-[0.98] hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Updating…
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
