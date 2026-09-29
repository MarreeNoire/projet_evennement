import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCurrentProfile } from "@/lib/supabase/server";
import { UserSettingsForm } from "@/components/auth/user-settings-form";
import { getMyNotificationPreferences } from "@/lib/notifications/queries";

export const metadata = {
  title: "Réglages & Paramètres | Event",
  description: "Configure tes préférences de confidentialité et de notification.",
};

export default async function ReglagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion?redirect=/reglages");
  const notificationPreferences = await getMyNotificationPreferences();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="contenu" className="container-page flex-1 space-y-8 py-10">
        <div className="border-border max-w-3xl border-b pb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Réglages du Compte</h1>
          <p className="text-fg-muted mt-1 text-sm">
            Personnalise la sécurité de ton compte et la façon dont tu reçois tes alertes.
          </p>
        </div>

        <UserSettingsForm
          initialVisibility={profile.visibility ?? "public"}
          initialNotificationPreferences={notificationPreferences}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
