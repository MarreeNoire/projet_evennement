"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Wallet,
  Users,
  CalendarClock,
  Plus,
  Coins,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

type Campaign = {
  id: string;
  title: string;
  description: string;
  target_amount: number | null;
  fixed_amount: number | null;
  ends_at: string | null;
  totalAmount: number;
  contributorCount: number;
};

export function CotisationsHomeSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/cotisations")
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as { campaigns?: Campaign[] };
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
    <section aria-labelledby="cotisations-section-title" className="border-border border-b bg-bg-subtle py-12 md:py-16">
      <div className="container-page flex flex-col gap-8">
        {/* En-tête de section */}
        <div className="border-success flex flex-col gap-4 border-l-4 pl-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
                <Wallet className="size-3.5" /> Module 3 · Cotisations
              </span>
            </div>
            <h2 id="cotisations-section-title" className="font-display mt-2 text-2xl font-bold md:text-3xl">
              Gestion des Cotisations & Collectes de fonds
            </h2>
            <p className="text-fg-muted mt-1 max-w-2xl text-sm leading-relaxed">
              Collecte des fonds pour vos projets de groupe, événements, mariages ou projets communautaires avec suivi des participations en temps réel.
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

        {/* Atouts clés */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border-border bg-surface rounded-xl border p-4">
            <div className="bg-success/10 text-success mb-3 flex size-9 items-center justify-center rounded-lg font-bold">
              <Coins className="size-5" />
            </div>
            <h3 className="font-display text-sm font-bold">Multi-Paiements Mobile Money</h3>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              Intégration directe Wave, Orange Money et MTN pour collecter rapidement sans friction.
            </p>
          </div>

          <div className="border-border bg-surface rounded-xl border p-4">
            <div className="bg-success/10 text-success mb-3 flex size-9 items-center justify-center rounded-lg font-bold">
              <TrendingUp className="size-5" />
            </div>
            <h3 className="font-display text-sm font-bold">Jauges & Objectifs en direct</h3>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              Visibilité instantanée sur l&apos;avancement de la collecte avec jauges de progression.
            </p>
          </div>

          <div className="border-border bg-surface rounded-xl border p-4">
            <div className="bg-success/10 text-success mb-3 flex size-9 items-center justify-center rounded-lg font-bold">
              <CheckCircle2 className="size-5" />
            </div>
            <h3 className="font-display text-sm font-bold">Reçus & Transparence</h3>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              Reçu numérique pour chaque contributeur et historique complet exportable.
            </p>
          </div>
        </div>

        {/* Liste dynamique ou Aperçu des cotisations */}
        {loading ? (
          <div className="border-border bg-surface flex items-center justify-center rounded-xl border p-8">
            <p className="text-fg-muted text-sm">Chargement des collectes ouvertes…</p>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.slice(0, 3).map((campaign) => {
              const progress = campaign.target_amount
                ? Math.min(100, Math.round((campaign.totalAmount / Number(campaign.target_amount)) * 100))
                : null;
              return (
                <Link
                  key={campaign.id}
                  href={`/cotisations/${campaign.id}`}
                  className="group border-border bg-surface hover:border-success flex flex-col justify-between rounded-xl border p-5 transition-all hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {campaign.fixed_amount ? (
                        <Badge variant="neutral" className="text-2xs">
                          {Number(campaign.fixed_amount).toLocaleString("fr-FR")} F fixes
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="text-2xs">Libre</Badge>
                      )}
                      {campaign.ends_at ? (
                        <span className="text-2xs text-fg-muted flex items-center gap-1">
                          <CalendarClock className="size-3" />
                          {new Date(campaign.ends_at).toLocaleDateString("fr-FR")}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-display group-hover:text-success text-base font-bold transition-colors line-clamp-1">
                      {campaign.title}
                    </h3>
                    <p className="text-fg-muted mt-1 text-xs line-clamp-2">
                      {campaign.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-border/60 border-t flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-fg tabular-nums">
                        {Number(campaign.totalAmount).toLocaleString("fr-FR")} F CFA
                      </span>
                      <span className="text-fg-muted flex items-center gap-1">
                        <Users className="size-3.5" />
                        {campaign.contributorCount}
                      </span>
                    </div>

                    {progress !== null ? (
                      <div className="space-y-1">
                        <div className="bg-bg-muted h-1.5 overflow-hidden rounded-full">
                          <div
                            className="bg-success h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-2xs text-fg-muted text-right">
                          {progress}% sur {Number(campaign.target_amount).toLocaleString("fr-FR")} F
                        </p>
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
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
