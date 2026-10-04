"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CircleDollarSign, Repeat2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

type Tontine = {
  id: string;
  title: string;
  contribution_amount: number;
  currency: string;
  starts_on: string;
  status: "active" | "completed" | "cancelled";
  membership: { status: "invited" | "active" | "declined"; role: "owner" | "member" };
  members: { user_id: string; status: string; profile: { display_name: string; avatar_url: string | null } | null }[];
  latestCycle: { cycle_number: number; beneficiary_user_id: string | null; status: string } | null;
};

export function TontineDashboard() {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/tontines").then(async (response) => {
      const data = await response.json() as { tontines?: Tontine[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Impossible de charger les tontines.");
      setTontines(data.tontines ?? []);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-12 text-sm text-fg-muted">Chargement des tontines…</p>;
  if (error) return <p role="alert" className="py-8 text-sm text-danger">{error}</p>;
  if (!tontines.length) return (
    <div className="border-y border-border py-12">
      <Repeat2 className="mb-4 size-8 text-primary" aria-hidden="true" />
      <h2 className="font-display text-2xl font-semibold">Aucune tontine pour le moment</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">Crée un groupe, fixe la contribution mensuelle et invite les personnes avec qui tu souhaites organiser une rotation.</p>
      <ButtonLink href="/tontines/nouvelle" className="mt-5">Créer une tontine</ButtonLink>
    </div>
  );

  return (
    <ul className="divide-y divide-border border-y border-border">
      {tontines.map((tontine) => {
        const owner = tontine.membership.role === "owner";
        const beneficiary = tontine.latestCycle?.beneficiary_user_id
          ? tontine.members.find((member) => member.user_id === tontine.latestCycle?.beneficiary_user_id)?.profile?.display_name
          : null;
        return (
          <li key={tontine.id}>
            <Link href={`/tontines/${tontine.id}`} className="group flex flex-col gap-4 py-5 transition-colors hover:bg-bg-muted/60 sm:flex-row sm:items-center sm:justify-between sm:px-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold group-hover:text-primary">{tontine.title}</h2>
                  {tontine.membership.status === "invited" ? <Badge variant="warning">Invitation</Badge> : null}
                  {tontine.status !== "active" ? <Badge variant="neutral">{tontine.status === "completed" ? "Terminée" : "Annulée"}</Badge> : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted">
                  <span className="inline-flex items-center gap-1.5"><CircleDollarSign className="size-3.5" aria-hidden="true" />{Number(tontine.contribution_amount).toLocaleString("fr-FR")} F CFA / mois</span>
                  <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" aria-hidden="true" />{tontine.members.filter((member) => member.status === "active").length} membres actifs</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />Depuis le {new Date(`${tontine.starts_on}T12:00:00`).toLocaleDateString("fr-FR")}</span>
                </div>
                {beneficiary ? <p className="mt-2 text-sm">Dernier bénéficiaire : <strong>{beneficiary}</strong></p> : null}
                {!owner && tontine.membership.status === "invited" ? <p className="mt-2 text-sm font-medium text-primary">Ton avis est attendu</p> : null}
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">Ouvrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
