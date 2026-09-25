import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Spinner } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Connexion" };

/* Page de connexion : redirige vers l'accueil si déjà authentifié. */

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="border-t border-border pt-4">
        <p className="eyebrow">Connexion</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.02] font-semibold">Bon retour.</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Connecte-toi pour retrouver tes billets et tes salons {APP_NAME}.
        </p>
      </div>
      {/* Suspense requis : le formulaire lit ?redirect= via useSearchParams. */}
      <Suspense fallback={<Spinner label="Chargement du formulaire…" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-fg-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
