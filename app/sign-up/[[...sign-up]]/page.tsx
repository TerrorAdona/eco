import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/components/auth/clerk-appearance";

export default function Page() {
  return (
    <AuthShell
      eyebrow="Commencez gratuitement"
      title="Créez votre compte"
      subtitle="Quelques secondes suffisent pour démarrer. Établissez votre premier budget dès aujourd'hui."
    >
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}