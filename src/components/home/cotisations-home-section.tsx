"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Wallet, Plus, Coins } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { CotisationHorizontalList, type CotisationItem } from "@/components/community-finance/cotisation-horizontal-list";

export function CotisationsHomeSection() {
  const [campaigns, setCampaigns] = useState<CotisationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/cotisations")
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as { campaigns?: CotisationItem[] };
        return data.campaigns ?? [];
      })
      .then((items) => {
        if (active) setCampaigns(items);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="cotisations-section-title" className="border-border border-b bg-bg-subtle py-10 md:py-14">
      <div className="container-page flex flex-col gap-8">
        {/* En-tête de section */}
        <div className="border-success flex flex-col gap-4 border-l-4 pl-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
              <Wallet className="size-3.5" /> Module 3 · Cotisations
            </span>
            <h2 id="cotisations-section-title" className="font-display mt-2 text-2xl font-bold md:text-3xl">
              Gestion des Cotisations & Collectes de fonds
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
        {loading ? (
          <div className="border-border bg-surface flex items-center justify-center rounded-xl border p-8">
            <p className="text-fg-muted text-sm">Chargement des collectes ouvertes…</p>
          </div>
        ) : campaigns.length > 0 ? (
          <CotisationHorizontalList cotisations={campaigns} />
        ) : (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-8 px-4 text-center">
            <Coins className="text-success mb-3 size-10 opacity-70" />
            <h3 className="font-display text-base font-bold">Lance ta première collecte</h3>
            <p className="text-fg-muted mt-1 max-w-md text-xs leading-relaxed">
              Crée une cagnotte en quelques clics et partage le lien pour recevoir les contributions en Mobile Money.
            </p>
            <ButtonLink href="/cotisations/nouvelle" size="sm" className="bg-success text-white hover:bg-success/90 mt-4">
              Démarrer une collecte
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
