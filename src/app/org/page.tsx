import { Plus, Calendar, Clock, FileText, Users, Ticket, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getOrganizerEvents } from "@/lib/events/queries";
import { formatDateRange, isPast } from "@/lib/utils";

export const metadata = {
  title: "Tableau de Bord Organisateur | Event",
  description: "Vue d'ensemble de vos événements, ventes et revenus.",
};

export default async function OrgDashboardPage() {
  const events = await getOrganizerEvents();

  const publishedCount = events.filter((event) => event.status === "published").length;
  const draftCount = events.filter((event) => event.status === "draft").length;
  const upcomingCount = events.filter(
    (event) => event.status === "published" && !isPast(event.end_at),
  ).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-sm text-fg-muted">
            Bienvenue dans votre espace d&apos;organisation et de gestion de la billetterie.
          </p>
        </div>
        <ButtonLink href="/org/evenements/nouveau" className="w-full sm:w-auto">
          <Plus className="mr-2 size-4" /> Créer un événement
        </ButtonLink>
      </div>

      {/* Chiffres réels, calculés sur vos événements en base */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Mes Événements"
          value={String(events.length)}
          hint="Brouillons et publiés"
          icon={<Calendar className="size-5" />}
          compact
          className="p-3 sm:p-4"
        />
        <StatCard
          label="Publiés"
          value={String(publishedCount)}
          hint="Statut « publié »"
          icon={<FileText className="size-5" />}
          compact
          className="p-3 sm:p-4"
        />
        <StatCard
          label="Visibles dans Explorer"
          value={String(upcomingCount)}
          hint="Publiés et non terminés"
          icon={<Clock className="size-5" />}
          compact
          className="p-3 sm:p-4"
        />
        <StatCard
          label="Brouillons"
          value={String(draftCount)}
          hint="À publier pour être visibles"
          icon={<Ticket className="size-5" />}
          compact
          className="p-3 sm:p-4"
        />
      </div>

      {/* Actions rapides & Derniers événements */}
      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3">
            <CardTitle className="text-base">Événements Récents</CardTitle>
            <ButtonLink href="/org/evenements" variant="ghost" size="sm">
              Tout voir
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {events.length === 0 ? (
              <EmptyState
                icon={<Calendar />}
                title="Aucun événement"
                description="Créez votre premier événement et publiez-le pour qu'il apparaisse dans Explorer."
                action={<ButtonLink href="/org/evenements/nouveau">Créer un événement</ButtonLink>}
              />
            ) : (
              events.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm text-fg">{event.title}</p>
                    <p className="text-xs text-fg-subtle">
                      {formatDateRange(event.start_at, event.end_at)}
                      {event.venue_name ? ` · ${event.venue_name}` : ""}
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

        <Card className="bg-primary-subtle/20 border-primary/20">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base text-primary font-bold flex items-center gap-2">
              <Plus className="size-5" /> Raccourcis de Gestion
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0">
            <ButtonLink href="/org/check-in" variant="secondary" aria-label="Ouvrir l’outil de Check-in à l’entrée" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm">
              <Ticket className="mr-2 size-4 text-primary" /> Check-in
            </ButtonLink>
            <ButtonLink href="/org/billetterie" variant="secondary" aria-label="Configurer les tarifs de billets" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm">
              <Plus className="mr-2 size-4 text-primary" /> Tarifs des billets
            </ButtonLink>
            <ButtonLink href="/org/paiements" variant="secondary" aria-label="Demander un virement Mobile Money ou bancaire" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm">
              <Wallet className="mr-2 size-4 text-primary" /> Virements
            </ButtonLink>
            <ButtonLink href="/org/participants" variant="secondary" aria-label="Voir les participants et leurs billets" className="min-h-16 justify-start whitespace-normal px-2 text-left text-xs sm:text-sm">
              <Users className="mr-2 size-4 text-primary" /> Participants
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
