"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthPanelProps = {
  isSignedIn: boolean;
  email?: string;
};

export default function AuthPanel({ isSignedIn, email }: AuthPanelProps) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [formEmail, setFormEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formEmail,
          password,
        });
        if (signInError) throw signInError;
        setMessage("Signed in successfully.");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formEmail,
          password,
        });
        if (signUpError) throw signUpError;

        setMessage("Account created! Check your email if confirmation is required.");
      }

      setFormEmail("");
      setPassword("");
      router.refresh();
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error ? caughtError.message : "Authentication failed.";
      setError(nextError);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setBusy(false);
      return;
    }
    window.location.href = "/account";
  };

  if (isSignedIn) {
    return (
      <div className="space-y-3 rounded-xl border border-green-200 bg-green-50/70 p-4">
        <p className="text-sm text-zinc-700">
          Signed in as <span className="font-semibold">{email}</span>
        </p>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Signing out..." : "Sign Out"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-lg px-3 py-1 text-sm font-semibold ${
            mode === "signin" ? "bg-blue-600 text-white" : "bg-white text-blue-700"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg px-3 py-1 text-sm font-semibold ${
            mode === "signup" ? "bg-pink-600 text-white" : "bg-white text-pink-700"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={submitAuth} className="grid gap-3">
        {/* Always-visible fields */}
        <input
          type="email"
          placeholder="Email"
          required
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy
            ? "Please wait..."
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
    </div>
  );
}
