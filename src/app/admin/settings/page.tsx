import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import FallbackRatesEditor from "@/components/admin/FallbackRatesEditor";
import { FALLBACK_RATES, type Rates } from "@/lib/currency";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const { data: ratesRow } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "currency_fallback_rates")
    .single();

  let savedRates: Rates = FALLBACK_RATES;
  if (ratesRow?.value) {
    try {
      savedRates = { ...FALLBACK_RATES, ...JSON.parse(ratesRow.value as string) };
    } catch {
      // malformed JSON — use hardcoded defaults
    }
  }

  return (
    <section className="space-y-8 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-blue-300">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-700">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Signed in as{" "}
          <span className="font-semibold">{authData?.user?.email}</span>
        </p>
      </div>

      <div className="max-w-sm space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500">
          Change Password
        </h2>
        <ChangePasswordForm />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500">
          Currency Fallback Rates
        </h2>
        <FallbackRatesEditor initialRates={savedRates} />
      </div>
    </section>
  );
}
