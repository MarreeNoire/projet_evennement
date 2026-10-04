"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, Coins, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

type Campaign = {
  id: string;
  title: string;
  description: string;
  target_amount: number | null;
  fixed_amount: number | null;
  ends_at: string | null;
  currency: string;
  totalAmount: number;
  contributorCount: number;
  creator: { display_name: string; avatar_url: string | null } | null;
};

export function CotisationList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/cotisations", { cache: "no-store" });
        const data = await response.json() as { campaigns?: Campaign[]; error?: string };
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
    const interval = window.setInterval(() => { void load(); }, 20_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (loading) return <p className="py-12 text-sm text-fg-muted">Chargement des collectes…</p>;
  if (error) return <p role="alert" className="py-8 text-sm text-danger">{error}</p>;
  if (!campaigns.length) return (
    <div className="border-y border-border py-12">
      <Coins className="mb-4 size-8 text-primary" aria-hidden="true" />
      <h2 className="font-display text-2xl font-semibold">Aucune collecte ouverte</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">Les collectes publiées apparaîtront ici. Tu peux lancer la tienne pour réunir des contributions autour d’un projet.</p>
      <ButtonLink href="/cotisations/nouvelle" className="mt-5">Créer une collecte</ButtonLink>
    </div>
  );

  return (
    <ul className="divide-y divide-border border-y border-border">
      {campaigns.map((campaign) => {
        const progress = campaign.target_amount ? Math.min(100, Math.round(campaign.totalAmount / Number(campaign.target_amount) * 100)) : null;
        return (
          <li key={campaign.id}>
            <Link href={`/cotisations/${campaign.id}`} className="group grid gap-4 py-6 transition-colors hover:bg-bg-muted/50 sm:grid-cols-[minmax(0,1fr)_12rem] sm:px-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold group-hover:text-primary">{campaign.title}</h2>
                  {campaign.fixed_amount ? <Badge variant="neutral">{Number(campaign.fixed_amount).toLocaleString("fr-FR")} F fixes</Badge> : <Badge variant="neutral">Montant libre</Badge>}
                </div>
                <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-fg-muted">{campaign.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-fg-muted">
                  {campaign.creator ? <span className="inline-flex items-center gap-2"><Avatar src={campaign.creator.avatar_url} name={campaign.creator.display_name} size="xs" />{campaign.creator.display_name}</span> : null}
                  <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" aria-hidden="true" />{campaign.contributorCount} contribution{campaign.contributorCount === 1 ? "" : "s"}</span>
                  {campaign.ends_at ? <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" aria-hidden="true" />Jusqu’au {new Date(campaign.ends_at).toLocaleDateString("fr-FR")}</span> : null}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2 sm:pl-4">
                <p className="text-xl font-semibold tabular-nums">{Number(campaign.totalAmount).toLocaleString("fr-FR")} <span className="text-xs font-medium">F CFA</span></p>
                {progress !== null ? (
                  <>
                    <div role="progressbar" aria-label={`Progression de ${campaign.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden bg-bg-muted">
                      <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-fg-muted">{progress}% · objectif {Number(campaign.target_amount).toLocaleString("fr-FR")} F</p>
                  </>
                ) : <p className="text-xs text-fg-muted">Collecte sans objectif</p>}
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary">Contribuer <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
