"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  PiggyBank,
  Users,
  CalendarDays,
  Repeat2,
  Plus,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

type Tontine = {
  id: string;
  title: string;
  cover_url: string | null;
  contribution_amount: number;
  currency: string;
  starts_on: string;
  status: "active" | "completed" | "cancelled";
  members: { status: string }[];
};

export function TontinesHomeSection() {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/tontines")
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as { tontines?: Tontine[] };
        return data.tontines ?? [];
      })
      .then((items) => {
        if (active) setTontines(items);
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
    <section aria-labelledby="tontines-section-title" className="border-border border-b bg-surface py-12 md:py-16">
      <div className="container-page flex flex-col gap-8">
        {/* En-tête de section */}
        <div className="border-accent flex flex-col gap-4 border-l-4 pl-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-accent/10 text-accent-fg inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
                <PiggyBank className="size-3.5" /> Module 2 · Tontines
              </span>
            </div>
            <h2 id="tontines-section-title" className="font-display mt-2 text-2xl font-bold md:text-3xl">
              Gestion des Tontines & Épargne collective
            </h2>
            <p className="text-fg-muted mt-1 max-w-2xl text-sm leading-relaxed">
              Crée et gère tes tontines en toute transparence. Fixe les cotisations mensuelles, invite les participants et suis les tirages de rotation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <ButtonLink href="/tontines/nouvelle" size="sm" className="bg-accent text-accent-fg hover:bg-accent/90">
              <Plus className="mr-1.5 size-4" /> Créer une tontine
            </ButtonLink>
            <ButtonLink href="/tontines" variant="secondary" size="sm">
              Toutes les tontines <ArrowRight className="ml-1 size-3.5" />
            </ButtonLink>
          </div>
        </div>

        {/* Avantages & Fonctionnalités du module */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border-border bg-bg-subtle rounded-xl border p-4">
            <div className="bg-accent/10 text-accent-fg mb-3 flex size-9 items-center justify-center rounded-lg font-bold">
              <Repeat2 className="size-5" />
            </div>
            <h3 className="font-display text-sm font-bold">Rotations automatisées</h3>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              Tirage au sort ou ordre prédéfini. Chaque membre connaît à l&apos;avance son mois de bénéfice.
            </p>
          </div>

          <div className="border-border bg-bg-subtle rounded-xl border p-4">
            <div className="bg-accent/10 text-accent-fg mb-3 flex size-9 items-center justify-center rounded-lg font-bold">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="font-display text-sm font-bold">Paiements sécurisés</h3>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              Versements enregistrés avec reçu instantané via Mobile Money (Wave, Orange Money, MTN).
            </p>
          </div>

          <div className="border-border bg-bg-subtle rounded-xl border p-4">
            <div className="bg-accent/10 text-accent-fg mb-3 flex size-9 items-center justify-center rounded-lg font-bold">
              <Zap className="size-5" />
            </div>
            <h3 className="font-display text-sm font-bold">Rappels & Suivi</h3>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              Notifications automatiques avant chaque échéance pour que personne n&apos;oublie de cotiser.
            </p>
          </div>
        </div>

        {/* Liste dynamique ou Aperçu des tontines */}
        {loading ? (
          <div className="border-border bg-bg-subtle flex items-center justify-center rounded-xl border p-8">
            <p className="text-fg-muted text-sm">Chargement des tontines actives…</p>
          </div>
        ) : tontines.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tontines.slice(0, 3).map((tontine) => (
              <Link
                key={tontine.id}
                href={`/tontines/${tontine.id}`}
                className="group border-border bg-surface hover:border-accent flex flex-col justify-between rounded-xl border p-5 transition-all hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="neutral" className="text-2xs">
                      {tontine.status === "active" ? "En cours" : "Terminée"}
                    </Badge>
                    <span className="text-2xs text-fg-muted">
                      Depuis le {new Date(`${tontine.starts_on}T12:00:00`).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <h3 className="font-display group-hover:text-accent-fg text-base font-bold transition-colors">
                    {tontine.title}
                  </h3>
                </div>

                <div className="border-border/60 mt-4 border-t pt-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-fg tabular-nums">
                    {Number(tontine.contribution_amount).toLocaleString("fr-FR")} F CFA / mois
                  </span>
                  <span className="text-fg-muted flex items-center gap-1">
                    <Users className="size-3.5" />
                    {tontine.members?.filter((m) => m.status === "active").length ?? 0} membres
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-border bg-bg-subtle flex flex-col items-center justify-center rounded-xl border py-8 px-4 text-center">
            <PiggyBank className="text-accent-fg mb-3 size-10 opacity-70" />
            <h3 className="font-display text-base font-bold">Lance ta première tontine</h3>
            <p className="text-fg-muted mt-1 max-w-md text-xs leading-relaxed">
              Rassemble tes proches ou collègues, choisis le montant de la cotisation et commence l&apos;épargne collective.
            </p>
            <ButtonLink href="/tontines/nouvelle" size="sm" className="bg-accent text-accent-fg hover:bg-accent/90 mt-4">
              Créer un groupe de tontine
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
