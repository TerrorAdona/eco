import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/components/auth/clerk-appearance";

export default function Page() {
  return (
    <AuthShell
      eyebrow="Votre espace sécurisé"
      title="Bon retour parmi nous"
      subtitle="Connectez-vous pour retrouver vos finances, vos budgets et vos objectifs au même endroit."
    >
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}