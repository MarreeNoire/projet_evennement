import { ArrowRight, Plus, Coins } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import {
  CotisationHorizontalList,
  type CotisationItem,
} from "@/components/community-finance/cotisation-horizontal-list";

export function CotisationsHomeSection({ campaigns }: { campaigns: CotisationItem[] }) {
  return (
    <section aria-labelledby="cotisations-section-title" className="border-border border-b bg-bg-subtle py-8 md:py-10">
      <div className="container-page flex flex-col gap-6">
        {/* En-tête de section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="cotisations-section-title" className="font-display text-2xl font-bold md:text-3xl">
              Collectes de cotisations
            </h2>
            <p className="text-fg-muted mt-1 max-w-2xl text-sm leading-relaxed">
              Fais défiler les collectes ouvertes. Collecte des fonds pour vos projets de groupe et événements avec suivi en temps réel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <ButtonLink href="/cotisations/nouvelle" size="sm" className="bg-success text-white hover:bg-success/90">
              <Plus className="mr-1.5 size-4" /> Créer une collecte
            </ButtonLink>
            <ButtonLink href="/cotisations" variant="secondary" size="sm">
              Toutes les collectes <ArrowRight className="ml-1 size-3.5" />
            </ButtonLink>
          </div>
        </div>

        {/* Liste sous forme de défilement horizontal */}
        {campaigns.length > 0 ? (
          <CotisationHorizontalList cotisations={campaigns} />
        ) : (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border px-4 py-6 text-center">
            <Coins className="text-success mb-3 size-10 opacity-70" />
            <h3 className="font-display text-base font-bold">Lance ta première collecte</h3>
            <p className="text-fg-muted mt-1 max-w-md text-xs leading-relaxed">
              Crée une cagnotte en quelques clics et partage le lien pour recevoir les contributions en Mobile Money.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
