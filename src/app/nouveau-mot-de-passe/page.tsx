import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="border-t border-border pt-4">
        <p className="eyebrow">Compte</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.02] font-semibold">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 text-sm text-fg-muted">Choisis un mot de passe solide et unique.</p>
      </div>
      <ResetPasswordForm />
    </main>
  );
}
