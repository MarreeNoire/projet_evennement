import Link from "next/link";
import { BarChart3, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Statistiques & Analytics | Rassemble",
  description: "Rapports de ventes et analyse des performances d'événements.",
};

export default async function OrgAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Statistiques & Performance</h1>
        <p className="text-sm text-fg-muted">
          Suivi des ventes, heures de pointe d&apos;achat et profil de vos participants.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Chiffre d'Affaires Cumulé"
          value={formatPrice(2450000)}
          hint="Revenus bruts générés"
          icon={<DollarSign className="size-5" />}
        />
        <StatCard
          label="Prix Moyen du Billet"
          value={formatPrice(5051)}
          hint="Calculé sur 485 ventes"
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          label="Taux de Remplissage Moyen"
          value="82 %"
          hint="Sur vos 3 événements actifs"
          icon={<Users className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition par Moyen de Paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>Wave Money</span>
              <span>45 % (1 102 500 FCFA)</span>
            </div>
            <div className="h-2 w-full bg-bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[45%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>Orange Money</span>
              <span>30 % (735 000 FCFA)</span>
            </div>
            <div className="h-2 w-full bg-bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-warning w-[30%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>MTN MoMo & Moov</span>
              <span>15 % (367 500 FCFA)</span>
            </div>
            <div className="h-2 w-full bg-bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent w-[15%]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
