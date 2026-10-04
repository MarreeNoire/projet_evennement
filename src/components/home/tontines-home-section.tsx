"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, PiggyBank, Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { TontineHorizontalList, type TontineItem } from "@/components/community-finance/tontine-horizontal-list";

export function TontinesHomeSection() {
  const [tontines, setTontines] = useState<TontineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/tontines")
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as { tontines?: TontineItem[] };
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
    <section aria-labelledby="tontines-section-title" className="border-border border-b bg-surface py-10 md:py-14">
      <div className="container-page flex flex-col gap-8">
        {/* En-tête de section */}
        <div className="border-accent flex flex-col gap-4 border-l-4 pl-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="bg-accent/10 text-accent-fg inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
              <PiggyBank className="size-3.5" /> Module 2 · Tontines
            </span>
            <h2 id="tontines-section-title" className="font-display mt-2 text-2xl font-bold md:text-3xl">
              Gestion des Tontines & Épargne collective
            </h2>
            <p className="text-fg-muted mt-1 max-w-2xl text-sm leading-relaxed">
              Fais défiler les tontines actives. Crée et gère tes groupes avec tirages de rotation et cotisations mensuelles.
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

        {/* Liste sous forme de défilement horizontal */}
        {loading ? (
          <div className="border-border bg-bg-subtle flex items-center justify-center rounded-xl border p-8">
            <p className="text-fg-muted text-sm">Chargement des tontines actives…</p>
          </div>
        ) : tontines.length > 0 ? (
          <TontineHorizontalList tontines={tontines} />
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
