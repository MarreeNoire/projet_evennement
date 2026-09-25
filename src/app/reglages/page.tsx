import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCurrentProfile } from "@/lib/supabase/server";
import { UserSettingsForm } from "@/components/auth/user-settings-form";

export const metadata = {
  title: "Réglages & Paramètres | Rassemble",
  description: "Configure tes préférences de confidentialité et de notification.",
};

export default async function ReglagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion?redirect=/reglages");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 py-10 space-y-8">
        <div className="border-b border-border pb-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight">Réglages du Compte</h1>
          <p className="mt-1 text-fg-muted text-sm">
            Personnalise la sécurité de ton compte et la façon dont tu reçois tes alertes.
          </p>
        </div>

        <UserSettingsForm initialVisibility={profile.visibility ?? "public"} />
      </main>
      <SiteFooter />
    </div>
  );
}
