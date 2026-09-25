import Link from "next/link";
import { Flag, ShieldCheck, Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

export const metadata = {
  title: "Centre de Modération | Super Admin | Rassemble",
  description: "Gestion des signalements de contenus ou commentaires inappropriés.",
};

export default async function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Queue de Modération</h1>
        <p className="text-sm text-fg-muted">
          Examinez et traitez les publications, commentaires ou profils signalés par les membres.
        </p>
      </div>

      <EmptyState
        title="Aucun signalement en attente"
        description="Bravo ! La communauté Rassemble respecte la charte de convivialité."
      />
    </div>
  );
}
