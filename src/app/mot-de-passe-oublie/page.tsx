import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="border-t border-border pt-4">
        <p className="eyebrow">Compte</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.02] font-semibold">
          Mot de passe oublié ?
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
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
