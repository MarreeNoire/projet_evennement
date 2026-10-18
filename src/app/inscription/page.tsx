import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { AuthScreen } from "@/components/auth/auth-screen";
import { BackButton } from "@/components/auth/back-button";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthScreen>
      <section className="auth-card" aria-labelledby="inscription-title">
        <header className="auth-card-header">
          <Logo />
          <BackButton />
        </header>
        <div className="auth-card-heading">
          <p className="eyebrow">Inscription</p>
          <h1
            id="inscription-title"
            className="font-display mt-2 text-4xl leading-[1.02] font-semibold"
          >
            Rejoins la communauté.
          </h1>
          <p className="text-fg-muted mt-2 text-sm">
            Un compte gratuit pour tes billets, tes salons et ton networking.
          </p>
        </div>
        <RegisterForm />
        <p className="text-fg-muted text-center text-sm">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </section>
    </AuthScreen>
  );
}
