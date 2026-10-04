import { redirect } from "next/navigation";

import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { CotisationCreateForm } from "@/components/community-finance/cotisation-create-form";
import { ROUTES } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Créer une collecte | Event" };

export default async function NewCotisationPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=/cotisations/nouvelle`);
  return (
    <SocialShell active="cotisations">
      <div className="flex flex-col gap-8">
        <SocialPageHeader eyebrow="Nouvelle collecte" title="Lancer un projet commun" description="Présente la cause, choisis un objectif et définis comment les contributions seront calculées." />
        <CotisationCreateForm />
      </div>
    </SocialShell>
  );
}
