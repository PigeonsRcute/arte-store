import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/account/SignOutButton";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const adminRoles = ["owner", "editor", "support", "viewer", "nails_admin"];
  const isAdmin = adminRoles.includes(profile?.role ?? "");

  if (!user) {
    return (
      <section className="space-y-5 rounded-2xl bg-white/90 p-8 shadow-lg ring-2 ring-pink-300">
        <h1 className="text-3xl font-black tracking-tight text-blue-700">Account</h1>
        <p className="text-zinc-600">
          Sign in or create an account to shop, manage your cart, and track your orders.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-block rounded-xl bg-yellow-400 px-6 py-3 font-black text-zinc-900 transition hover:bg-yellow-300"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-pink-500 px-6 py-3 font-black text-white transition hover:bg-pink-400"
          >
            Create Account
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-pink-300">
      <h1 className="text-3xl font-black tracking-tight text-blue-700">Account</h1>
      <p className="text-zinc-700">
        Signed in as <span className="font-semibold">{user.email}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/shop"
          className="inline-block rounded-xl bg-yellow-300 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-yellow-200"
        >
          Go to Shop
        </Link>
        <Link
          href="/cart"
          className="inline-block rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-400"
        >
          View Cart
        </Link>
        <Link
          href="/account/orders"
          className="inline-block rounded-xl bg-pink-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-pink-400"
        >
          My Orders
        </Link>
        <Link
          href="/account/settings"
          className="inline-block rounded-xl bg-zinc-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-600"
        >
          Settings
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className="inline-block rounded-xl bg-green-400 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-green-300"
          >
            Go to Admin
          </Link>
        ) : null}
        <SignOutButton />
      </div>
    </section>
  );
}
