import { redirect } from "next/navigation";

import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { TontineCreateForm } from "@/components/community-finance/tontine-create-form";
import { ROUTES } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Créer une tontine | Event" };

export default async function NewTontinePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`${ROUTES.login}?redirect=/tontines/nouvelle`);
  return (
    <SocialShell active="tontines">
      <div className="flex flex-col gap-8">
        <SocialPageHeader eyebrow="Nouvelle rotation" title="Créer une tontine" description="Définis la contribution mensuelle, le début du cycle et les membres à inviter." />
        <TontineCreateForm />
      </div>
    </SocialShell>
  );
}
