import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShippingAddressForm, { AddressFields } from "@/components/account/ShippingAddressForm";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login?reason=signin_required");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, street, city, postal_code, country")
    .eq("id", authData.user.id)
    .single();

  const defaultValues: Partial<AddressFields> = {
    fullName: profile?.full_name ?? "",
    street: profile?.street ?? "",
    city: profile?.city ?? "",
    postalCode: profile?.postal_code ?? "",
    country: profile?.country ?? "",
  };

  return (
    <section className="space-y-6 rounded-2xl bg-white/90 p-6 shadow-lg ring-2 ring-pink-300">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-700">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Signed in as <span className="font-semibold">{authData.user.email}</span>
        </p>
      </div>

      <div className="max-w-sm space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500">
          Shipping Address
        </h2>
        <ShippingAddressForm defaultValues={defaultValues} />
      </div>

      <div className="max-w-sm space-y-3 border-t border-zinc-200 pt-8">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500">
          Change Password
        </h2>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
