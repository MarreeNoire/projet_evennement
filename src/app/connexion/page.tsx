import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { BackButton } from "@/components/auth/back-button";
import authStyles from "@/components/auth/auth-editorial.module.css";
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
      <section className={authStyles.card} aria-labelledby="connexion-title">
        <header className={authStyles.cardHeader}>
          <p className={authStyles.cardLabel}>Accès membre</p>
          <BackButton />
        </header>
        <div className={authStyles.heading}>
          <p className={authStyles.eyebrow}>Connexion</p>
          <h1 id="connexion-title" className={authStyles.title}>
            Bon retour.
          </h1>
          <p className={authStyles.lede}>
            Connecte-toi pour retrouver tes billets et tes salons {APP_NAME}.
          </p>
        </div>
        <Suspense fallback={<Spinner label="Chargement du formulaire…" />}>
          <LoginForm />
        </Suspense>
        <p className={authStyles.switch}>
          Pas encore de compte ?{" "}
          <Link href="/inscription">Créer un compte</Link>
        </p>
      </section>
    </AuthScreen>
  );
}
