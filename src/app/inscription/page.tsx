import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <div className="border-t border-border pt-4">
        <p className="eyebrow">Inscription</p>
        <h1 className="mt-2 font-display text-4xl leading-[1.02] font-semibold">
          Rejoins la communauté.
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
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