import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import SignInForm from "@/components/auth/SignInForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthSplitLayout palette="yellow">
      <SignInForm reason={params.reason} next={params.next} />
    </AuthSplitLayout>
  );
}
