"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const supabase = createClient();

  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!current) errs.current = "Current password is required.";
    if (!newPw) errs.newPw = "New password is required.";
    else if (newPw.length < 8) errs.newPw = "New password must be at least 8 characters.";
    if (!confirm) errs.confirm = "Please confirm your new password.";
    else if (newPw && confirm !== newPw) errs.confirm = "Passwords do not match.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      // Re-authenticate to verify current password
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      if (!userEmail) throw new Error("Not signed in.");

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: current,
      });
      if (verifyError) {
        setFieldErrors({ current: "Current password is incorrect." });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
      if (updateError) throw updateError;

      setSuccess(true);
      setCurrent("");
      setNewPw("");
      setConfirm("");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Current password */}
      <div className="space-y-1.5">
        <label htmlFor="current-pw" className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Current Password
        </label>
        <input
          id="current-pw"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => { setCurrent(e.target.value); clearFieldError("current"); }}
          placeholder="Current password"
          className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 ${fieldErrors.current ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
        />
        {fieldErrors.current && (
          <p className="text-sm font-bold text-red-500">{fieldErrors.current}</p>
        )}
      </div>

      {/* New password */}
      <div className="space-y-1.5">
        <label htmlFor="new-pw" className="text-xs font-black uppercase tracking-widest text-zinc-400">
          New Password
        </label>
        <input
          id="new-pw"
          type="password"
          autoComplete="new-password"
          value={newPw}
          onChange={(e) => { setNewPw(e.target.value); clearFieldError("newPw"); }}
          placeholder="Min. 8 characters"
          className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 ${fieldErrors.newPw ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
        />
        {fieldErrors.newPw && (
          <p className="text-sm font-bold text-red-500">{fieldErrors.newPw}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label htmlFor="confirm-pw" className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Confirm New Password
        </label>
        <input
          id="confirm-pw"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); clearFieldError("confirm"); }}
          placeholder="Repeat your new password"
          className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 ${fieldErrors.confirm ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
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

      {/* Success */}
      {success && (
        <p className="rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          Password updated successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-black text-white transition active:scale-[0.98] hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Updating…
          </>
        ) : (
          "Update Password"
        )}
      </button>
    </form>
  );
}
