import { SocialPageHeader, SocialShell } from "@/components/social/social-shell";
import { CotisationDetail } from "@/components/community-finance/cotisation-detail";

export const metadata = { title: "Collecte communautaire | Event" };

export default async function CotisationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ contribution?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return (
    <SocialShell active="cotisations">
      <div className="flex flex-col gap-8">
        <SocialPageHeader eyebrow="Collecte communautaire" title="Un projet, plusieurs contributions" description="Suis la progression et participe par un paiement sécurisé." />
        <CotisationDetail id={id} contributionId={query.contribution} />
      </div>
    </SocialShell>
  );
}
