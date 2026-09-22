import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Mot de passe oublié ?</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Entre ton email : tu recevras un lien de réinitialisation.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-fg-muted">
        <Link href="/connexion" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
