import { ArrowRight, PiggyBank, Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import {
  TontineHorizontalList,
  type TontineItem,
} from "@/components/community-finance/tontine-horizontal-list";

export function TontinesHomeSection({ tontines }: { tontines: TontineItem[] }) {
  return (
    <section aria-labelledby="tontines-section-title" className="border-border border-b bg-surface py-8 md:py-10">
      <div className="container-page flex flex-col gap-6">
        {/* En-tête de section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="tontines-section-title" className="font-display text-2xl font-bold md:text-3xl">
              Tontines et épargne collective
            </h2>
            <p className="text-fg-muted mt-1 max-w-2xl text-sm leading-relaxed">
              Fais défiler les tontines actives. Crée et gère tes groupes avec tirages de rotation et cotisations mensuelles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <ButtonLink href="/tontines/nouvelle" size="sm" className="bg-accent-solid text-accent-solid-fg hover:brightness-95">
              <Plus className="mr-1.5 size-4" /> Créer une tontine
            </ButtonLink>
            <ButtonLink href="/tontines" variant="secondary" size="sm">
              Toutes les tontines <ArrowRight className="ml-1 size-3.5" />
            </ButtonLink>
          </div>
        </div>

        {/* Liste sous forme de défilement horizontal */}
        {tontines.length > 0 ? (
          <TontineHorizontalList tontines={tontines} />
        ) : (
          <div className="border-border bg-bg-subtle flex flex-col items-center justify-center rounded-xl border px-4 py-6 text-center">
            <PiggyBank className="text-accent mb-3 size-10 opacity-70" />
            <h3 className="font-display text-base font-bold">Lance ta première tontine</h3>
            <p className="text-fg-muted mt-1 max-w-md text-xs leading-relaxed">
              Rassemble tes proches ou collègues, choisis le montant de la cotisation et commence l&apos;épargne collective.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
