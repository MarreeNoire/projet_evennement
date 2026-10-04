import { redirect } from "next/navigation";

import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { TontineDetail } from "@/components/community-finance/tontine-detail";
import { ROUTES } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Détail de la tontine | Event" };

export default async function TontineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  const { id } = await params;
  if (!profile) redirect(`${ROUTES.login}?redirect=/tontines/${id}`);
  return (
    <SocialShell active="tontines">
      <div className="flex flex-col gap-8">
        <SocialPageHeader eyebrow="Tontine" title="Suivi du groupe" description="Échéances mensuelles, règlements et bénéficiaires de la rotation." />
        <TontineDetail id={id} />
      </div>
    </SocialShell>
  );
}
