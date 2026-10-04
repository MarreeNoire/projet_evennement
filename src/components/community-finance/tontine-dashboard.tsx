"use client";

import { useEffect, useState } from "react";
import { Repeat2 } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { TontineHorizontalList, type TontineItem } from "@/components/community-finance/tontine-horizontal-list";

export function TontineDashboard() {
  const [tontines, setTontines] = useState<TontineItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/tontines")
      .then(async (response) => {
        const data = (await response.json()) as { tontines?: TontineItem[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Impossible de charger les tontines.");
        setTontines(data.tontines ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-fg-muted py-12 text-sm">Chargement des tontines…</p>;
  if (error)
    return (
      <p role="alert" className="text-danger py-8 text-sm">
        {error}
      </p>
    );
  if (!tontines.length)
    return (
      <div className="border-border border-y py-12">
        <Repeat2 className="text-primary mb-4 size-8" aria-hidden="true" />
        <h2 className="font-display text-2xl font-semibold">Aucune tontine pour le moment</h2>
        <p className="text-fg-muted mt-2 max-w-lg text-sm leading-relaxed">
          Crée un groupe, fixe la contribution mensuelle et invite les personnes avec qui tu
          souhaites organiser une rotation.
        </p>
        <ButtonLink href="/tontines/nouvelle" className="mt-5">
          Créer une tontine
        </ButtonLink>
      </div>
    );

  return <TontineHorizontalList tontines={tontines} />;
}
