import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join Kingdom Studio AI and begin your filmmaking journey."
    >
      <SignupForm />
    </AuthLayout>
  );
}