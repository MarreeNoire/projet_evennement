import Link from "next/link";
import { Wallet, DollarSign, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Gestion des Paiements & Commissions | Admin | Rassemble",
  description: "Suivi des flux financiers globaux de la plateforme.",
};

export default async function AdminPaiementsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Commissions & Flux Financiers</h1>
        <p className="text-sm text-fg-muted">
          Synthèse des transactions Mobile Money (Wave, Orange, MTN, Moov) et reversements.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Commissions Perçues (5%)"
          value={formatPrice(2425000)}
          hint="Sur toutes les commandes validées"
          icon={<Wallet className="size-5 text-success" />}
        />
        <StatCard
          label="Demandes de Virement en Attente"
          value="0"
          hint="Tous les reversements organisateurs sont à jour"
        />
      </div>
    </div>
  );
}
