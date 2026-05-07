import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout palette="purple">
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
