import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrgEventDetailEditor } from "@/components/events/org-event-detail-editor";
import { OrgEventTicketTypesEditor } from "@/components/events/org-event-ticket-types-editor";
import { getOrganizerEventTicketTypes } from "@/lib/events/queries";
import { formatNumber, formatPercent, formatPrice, toDateTimeLocalValue } from "@/lib/utils";

export const metadata = {
  title: "Gérer l'Événement | Event",
  description: "Détails et modifications de votre événement",
};

/** Ligne de la vue `event_stats` utilisée par les cartes de statistiques. */
interface EventStatsRow {
  tickets_sold: number;
  gross_revenue: number;
  checked_in: number;
  capacity: number | null;
}

export default async function OrgEvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let eventData: any = null;
  let stats: EventStatsRow | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("events")
      .select("*, cover_url, gallery")
      .eq("id", id)
      .maybeSingle();
    eventData = data;

    if (data) {
      // Statistiques réelles (la vue applique la RLS : l'organisateur ne voit
      // que les ventes de ses propres événements).
      const { data: statsRow } = await supabase
        .from("event_stats")
        .select("tickets_sold, gross_revenue, checked_in, capacity")
        .eq("event_id", id)
        .maybeSingle();
      stats = (statsRow as EventStatsRow | null) ?? null;
    }
  } catch {
    // Ignorer : la page reste utilisable pour corriger l'événement.
  }

  const eventTickets = await getOrganizerEventTicketTypes(id);
  const ticketsSold = stats?.tickets_sold ?? 0;
  const capacity = stats?.capacity ?? eventData?.capacity ?? null;
  const grossRevenue = stats?.gross_revenue ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const fillRate = capacity && capacity > 0 ? ticketsSold / capacity : null;
  const checkinRate = ticketsSold > 0 ? checkedIn / ticketsSold : 0;

  // Événement introuvable (identifiant inexistant, non autorisé, ou brouillon
  // purement local `draft-…`) : on l'annonce au lieu d'afficher une fiche vide.
  if (!eventData) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <ButtonLink href="/org/evenements" variant="ghost" size="sm">
            <ArrowLeft className="size-4" /> Retour à la liste
          </ButtonLink>
        </div>
        <EmptyState
          title="Événement introuvable"
          description="Cet événement n'existe pas en base ou ne dépend pas d'une organisation que vous gérez. S'il n'a été enregistré que dans ce navigateur, recréez-le pour pouvoir le publier."
          action={<ButtonLink href="/org/evenements/nouveau">Créer un événement</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <ButtonLink href="/org/evenements" variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Retour à la liste
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-fg-muted font-medium">Billets Vendus</p>
          <p className="text-2xl font-bold text-fg mt-1">{formatNumber(ticketsSold)}</p>
          <p className="text-xs text-fg-subtle mt-0.5">
            {capacity ? `sur ${formatNumber(capacity)} places` : "capacité non définie"}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-fg-muted font-medium">Revenus Générés</p>
          <p className="text-2xl font-bold text-success mt-1">{formatPrice(grossRevenue)}</p>
          <p className="text-xs text-fg-subtle mt-0.5">commandes payées</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-fg-muted font-medium">Taux de Remplissage</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {fillRate === null ? "Indisponible" : formatPercent(fillRate)}
          </p>
          <p className="text-xs text-fg-subtle mt-0.5">billets / capacité</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-fg-muted font-medium">Taux de Check-in</p>
          <p className="text-2xl font-bold text-fg mt-1">{formatPercent(checkinRate)}</p>
          <p className="text-xs text-fg-subtle mt-0.5">
            {formatNumber(checkedIn)} entrée{checkedIn > 1 ? "s" : ""} validée
            {checkedIn > 1 ? "s" : ""}
          </p>
        </Card>
      </div>

      <OrgEventDetailEditor
        id={id}
        initialTitle={eventData.title}
        initialVenue={eventData.venue_name ?? ""}
        initialCity={eventData.city ?? "Abidjan"}
        initialStatus={eventData.status}
        initialSlug={eventData.slug}
        initialStartAt={toDateTimeLocalValue(eventData.start_at)}
        initialEndAt={toDateTimeLocalValue(eventData.end_at)}
        initialCoverUrl={eventData.cover_url ?? null}
        initialGalleryUrls={eventData.gallery ?? []}
      />

      <OrgEventTicketTypesEditor
        eventId={id}
        initialTickets={eventTickets}
      />
    </div>
  );
}
