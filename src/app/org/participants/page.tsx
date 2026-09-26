import Link from "next/link";
import { Download, Search, Users, CheckCircle, Mail, Filter } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, AccessLevelBadge } from "@/components/ui/badge";

export const metadata = {
  title: "Liste des Participants | Espace Organisateur | Event",
  description: "Consultation et export des personnes inscrites à vos événements.",
};

export default async function OrgParticipantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Liste des Participants</h1>
          <p className="text-sm text-fg-muted">
            Recherchez des inscrits, vérifiez leur statut ou exportez la liste au format CSV.
          </p>
        </div>
        <Button variant="secondary">
          <Download className="mr-2 size-4" /> Exporter en CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-subtle" />
              <input
                type="search"
                placeholder="Nom, email, référence billet…"
                className="w-full rounded-md border border-border bg-transparent pl-9 pr-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select className="rounded-md border border-border bg-transparent px-3 py-1.5 text-xs text-fg-muted">
                <option value="">Tous les événements</option>
                <option value="1">Abidjan Tech Forum 2026</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border bg-bg-muted/50 text-xs font-semibold text-fg-muted uppercase">
              <tr>
                <th className="p-3 pl-5">Participant</th>
                <th className="p-3">Événement</th>
                <th className="p-3">Formule</th>
                <th className="p-3">Réf Billet</th>
                <th className="p-3 pr-5">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-bg-subtle">
                <td className="p-3 pl-5 font-semibold text-fg">Kouassi Jean-Marc</td>
                <td className="p-3 text-xs text-fg-muted">Abidjan Tech Forum 2026</td>
                <td className="p-3"><AccessLevelBadge level="vip" /></td>
                <td className="p-3 font-mono text-xs">ATF-98234</td>
                <td className="p-3 pr-5">
                  <Badge variant="success">Scanné</Badge>
                </td>
              </tr>
              <tr className="hover:bg-bg-subtle">
                <td className="p-3 pl-5 font-semibold text-fg">Ahou Marie-Claire</td>
                <td className="p-3 text-xs text-fg-muted">Abidjan Tech Forum 2026</td>
                <td className="p-3"><AccessLevelBadge level="standard" /></td>
                <td className="p-3 font-mono text-xs">ATF-44129</td>
                <td className="p-3 pr-5">
                  <Badge variant="neutral">En attente</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
