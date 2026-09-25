import Link from "next/link";
import { Wallet, ArrowDownRight, CheckCircle2, AlertCircle, Building2, Smartphone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Paiements & Reversements | Rassemble",
  description: "Suivi du solde disponible et demandes de virement Mobile Money.",
};

export default async function OrgPaiementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Solde & Reversements</h1>
          <p className="text-sm text-fg-muted">
            Transférez vos revenus vers votre compte Mobile Money (Wave, Orange, MTN, Moov) ou bancaire.
          </p>
        </div>
        <Button>
          <ArrowDownRight className="mr-2 size-4" /> Demander un reversement
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Solde Disponible"
          value={formatPrice(2327500)}
          hint="Après commission de 5%"
          icon={<Wallet className="size-5 text-success" />}
        />
        <StatCard
          label="Commissions Plateforme (5%)"
          value={formatPrice(122500)}
          hint="Prélevées à la source"
        />
        <StatCard
          label="Dernier Reversement"
          value={formatPrice(1500000)}
          hint="Payé le 10 Sept. 2026 via Wave"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des Transactions & Reversements</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border bg-bg-muted/50 text-xs font-semibold text-fg-muted uppercase">
              <tr>
                <th className="p-3 pl-5">Date</th>
                <th className="p-3">Type / Moyen</th>
                <th className="p-3">Montant Brut</th>
                <th className="p-3">Net Organisateur</th>
                <th className="p-3 pr-5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-bg-subtle">
                <td className="p-3 pl-5 text-xs text-fg-muted">10/09/2026</td>
                <td className="p-3 text-xs font-semibold flex items-center gap-1.5">
                  <Smartphone className="size-4 text-primary" /> Wave Mobile Money
                </td>
                <td className="p-3 font-mono text-xs">{formatPrice(1578947)}</td>
                <td className="p-3 font-mono text-xs font-bold text-success">{formatPrice(1500000)}</td>
                <td className="p-3 pr-5"><Badge variant="success" className="font-semibold">Effectué</Badge></td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
