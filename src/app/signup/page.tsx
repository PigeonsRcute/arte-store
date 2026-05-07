import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthSplitLayout palette="cyan">
      <SignUpForm />
    </AuthSplitLayout>
  );
}
