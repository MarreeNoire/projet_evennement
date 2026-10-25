import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { BackButton } from "@/components/auth/back-button";
import authStyles from "@/components/auth/auth-editorial.module.css";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthScreen>
      <section className={authStyles.card} aria-labelledby="inscription-title">
        <header className={authStyles.cardHeader}>
          <p className={authStyles.cardLabel}>Nouveau compte</p>
          <BackButton />
        </header>
        <div className={authStyles.heading}>
          <p className={authStyles.eyebrow}>Inscription</p>
          <h1 id="inscription-title" className={authStyles.title}>
            Rejoins la communauté.
          </h1>
          <p className={authStyles.lede}>
            Un compte gratuit pour tes billets, tes salons et ton networking.
          </p>
        </div>
        <RegisterForm />
        <p className={authStyles.switch}>
          Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
        </p>
      </section>
    </AuthScreen>
  );
}
