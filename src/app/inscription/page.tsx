import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscription" };

/* Page d'inscription : redirige vers l'accueil si déjà authentifié. */

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Rejoins la communauté 🎉</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Un compte gratuit pour tes billets, tes salons et ton networking.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-fg-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
