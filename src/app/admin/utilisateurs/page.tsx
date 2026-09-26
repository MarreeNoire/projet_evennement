import Link from "next/link";
import { Search, Users, Shield, Ban, CheckCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Gestion des Utilisateurs | Super Admin | Event",
  description: "Liste complète des utilisateurs et gestion des accès.",
};

export default async function AdminUtilisateursPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Utilisateurs de la Plateforme</h1>
        <p className="text-sm text-fg-muted">
          Recherche de profils, attribution de rôles et modération des comptes.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-5">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-subtle" />
            <input
              type="search"
              placeholder="Nom, email, username…"
              className="w-full rounded-md border border-border bg-transparent pl-9 pr-3 py-1.5 text-sm focus:border-border-focus focus:outline-none"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border bg-bg-muted/50 text-xs font-semibold text-fg-muted uppercase">
              <tr>
                <th className="p-3 pl-5">Nom d&apos;affichage</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Statut</th>
                <th className="p-3 pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-bg-subtle">
                <td className="p-3 pl-5 font-semibold text-fg">Super Administrateur</td>
                <td className="p-3"><Badge variant="danger">Admin</Badge></td>
                <td className="p-3"><Badge variant="success">Actif</Badge></td>
                <td className="p-3 pr-5">
                  <Button variant="ghost" size="sm">Gérer</Button>
                </td>
              </tr>
              <tr className="hover:bg-bg-subtle">
                <td className="p-3 pl-5 font-semibold text-fg">Events CI Sarl</td>
                <td className="p-3"><Badge variant="accent">Organisateur</Badge></td>
                <td className="p-3"><Badge variant="success">Actif</Badge></td>
                <td className="p-3 pr-5">
                  <Button variant="ghost" size="sm">Gérer</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
