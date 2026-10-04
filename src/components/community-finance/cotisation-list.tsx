"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { CotisationHorizontalList, type CotisationItem } from "@/components/community-finance/cotisation-horizontal-list";

export function CotisationList() {
  const [campaigns, setCampaigns] = useState<CotisationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/cotisations", { cache: "no-store" });
        const data = (await response.json()) as { campaigns?: CotisationItem[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Les collectes ne sont pas disponibles.");
        if (active) setCampaigns(data.campaigns ?? []);
        if (active) setError("");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 20_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) return <p className="text-fg-muted py-12 text-sm">Chargement des collectes…</p>;
  if (error)
    return (
      <p role="alert" className="text-danger py-8 text-sm">
        {error}
      </p>
    );
  if (!campaigns.length)
    return (
      <div className="border-border border-y py-12">
        <Coins className="text-primary mb-4 size-8" aria-hidden="true" />
        <h2 className="font-display text-2xl font-semibold">Aucune collecte ouverte</h2>
        <p className="text-fg-muted mt-2 max-w-lg text-sm leading-relaxed">
          Les collectes publiées apparaîtront ici. Tu peux lancer la tienne pour réunir des
          contributions autour d’un projet.
        </p>
        <ButtonLink href="/cotisations/nouvelle" className="mt-5">
          Créer une collecte
        </ButtonLink>
      </div>
    );

  return <CotisationHorizontalList cotisations={campaigns} />;
}
