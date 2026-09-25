import { Calendar, CheckCircle, Clock, Users, Wallet, Flag, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getRecentEvents } from "@/lib/events/queries";
import { formatDate, isPast } from "@/lib/utils";

export const metadata = {
  title: "Super Admin Dashboard | Rassemble",
  description: "Vue d'ensemble et contrôle de la plateforme.",
};

export default async function AdminDashboardPage() {
  const events = await getRecentEvents(10);

  const publishedCount = events.filter((event) => event.status === "published").length;
  const draftCount = events.filter((event) => event.status === "draft").length;
  const visibleCount = events.filter(
    (event) => event.status === "published" && !isPast(event.end_at),
  ).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Administration Globale</h1>
        <p className="text-sm text-fg-muted">
          Supervision des événements du réseau et de leur visibilité publique.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Événements Lisibles"
          value={String(events.length)}
          hint="Selon vos droits d'accès"
          icon={<Calendar className="size-5" />}
        />
        <StatCard
          label="Événements Publiés"
          value={String(publishedCount)}
          hint="Statut « publié »"
          icon={<CheckCircle className="size-5 text-success" />}
        />
        <StatCard
          label="Visibles dans Explorer"
          value={String(visibleCount)}
          hint="Publiés et non terminés"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="Brouillons"
          value={String(draftCount)}
          hint="Jamais exposés au public"
          icon={<Flag className="size-5 text-warning" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Derniers Événements Créés</CardTitle>
            <ButtonLink href="/admin/evenements" variant="ghost" size="sm">
              Tout voir
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <EmptyState
                title="Aucun événement"
                description="Aucun événement n'est lisible avec ce compte."
              />
            ) : (
              events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm text-fg">{event.title}</p>
                    <p className="text-xs text-fg-subtle">
                      Par {event.organizationName} · {formatDate(event.start_at)}
                    </p>
                  </div>
                  {event.status === "published" ? (
                    <Badge variant={isPast(event.end_at) ? "neutral" : "success"}>
                      {isPast(event.end_at) ? "Terminé" : "Publié"}
                    </Badge>
                  ) : (
                    <Badge variant="warning">Brouillon</Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" /> Actions de Modération
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ButtonLink href="/admin/evenements" variant="secondary" className="w-full justify-start">
              <Calendar className="mr-2 size-4 text-primary" /> Valider / Modérer des événements
            </ButtonLink>
            <ButtonLink href="/admin/utilisateurs" variant="secondary" className="w-full justify-start">
              <Users className="mr-2 size-4 text-primary" /> Gérer les rôles et suspensions
            </ButtonLink>
            <ButtonLink href="/admin/paiements" variant="secondary" className="w-full justify-start">
              <Wallet className="mr-2 size-4 text-primary" /> Approuver les virements organisateurs
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
