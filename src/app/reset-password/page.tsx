import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout palette="purple">
      <ResetPasswordForm />
    </AuthSplitLayout>
  );
}
