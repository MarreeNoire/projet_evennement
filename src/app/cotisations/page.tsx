import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { ButtonLink } from "@/components/ui/button";
import { CotisationList } from "@/components/community-finance/cotisation-list";

export const metadata = {
  title: "Collectes et cotisations | Event",
  description: "Découvre les collectes ouvertes et contribue aux projets de la communauté.",
};

export default function CotisationsPage() {
  return (
    <SocialShell active="cotisations">
      <div className="flex flex-col gap-8">
        <SocialPageHeader
          eyebrow="Projets partagés"
          title="Collectes et cotisations"
          accent="de la communauté."
          description="Soutiens une cause ou un projet par une contribution fixe ou libre."
          action={<ButtonLink href="/cotisations/nouvelle" variant="secondary">Créer une collecte</ButtonLink>}
        />
        <CotisationList />
      </div>
    </SocialShell>
  );
}
