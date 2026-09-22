import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Nouveau mot de passe</h1>
        <p className="mt-1.5 text-sm text-fg-muted">Choisis un mot de passe solide et unique.</p>
      </div>
      <ResetPasswordForm />
    </main>
  );
}
