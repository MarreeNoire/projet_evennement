import { redirect } from "next/navigation";

import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { ButtonLink } from "@/components/ui/button";
import { TontineDashboard } from "@/components/community-finance/tontine-dashboard";
import { ROUTES } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = {
  title: "Mes tontines | Event",
  description: "Organise une épargne collective, suis les échéances et les tirages.",
};

export default async function TontinesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=${ROUTES.tontines}`);
  return (
    <SocialShell active="tontines">
      <div className="flex flex-col gap-8">
        <SocialPageHeader
          eyebrow="Épargne collective"
          title="Les tontines"
          accent="du groupe."
          description="Invitations, contributions mensuelles, bénéficiaire du mois et historique de la rotation."
          action={<ButtonLink href="/tontines/nouvelle">Créer une tontine</ButtonLink>}
        />
        <TontineDashboard />
      </div>
    </SocialShell>
  );
}
