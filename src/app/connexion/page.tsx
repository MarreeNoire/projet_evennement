import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { BackButton } from "@/components/auth/back-button";
import { Logo } from "@/components/brand/logo";
import { Spinner } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Connexion" };

/* Page de connexion : redirige vers l'accueil si déjà authentifié. */

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthScreen>
      <section className="auth-card" aria-labelledby="connexion-title">
        <header className="auth-card-header">
          <Logo />
          <BackButton />
        </header>
        <div className="auth-card-heading">
          <p className="eyebrow">Connexion</p>
          <h1
            id="connexion-title"
            className="font-display mt-2 text-4xl leading-[1.02] font-semibold"
          >
            Bon retour.
          </h1>
          <p className="text-fg-muted mt-2 text-sm">
            Connecte-toi pour retrouver tes billets et tes salons {APP_NAME}.
          </p>
        </div>
        <Suspense fallback={<Spinner label="Chargement du formulaire…" />}>
          <LoginForm />
        </Suspense>
        <p className="text-fg-muted text-center text-sm">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-primary font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </section>
    </AuthScreen>
  );
}
