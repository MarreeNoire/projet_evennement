import { ArrowLeft } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrgEventDetailEditor, type EventStatsRow } from "@/components/events/org-event-detail-editor";
import { type EventTicketItem } from "@/components/events/org-event-ticket-types-editor";
import { toDateTimeLocalValue } from "@/lib/utils";

export const metadata = {
  title: "Gérer l'Événement | Espace Organisateur",
  description: "Détails, billetterie et modifications de votre événement",
};

export default async function OrgEvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let eventData: any = null;
  let stats: EventStatsRow | null = null;
  let eventTickets: EventTicketItem[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data }, { data: statsRow }, { data: tickets }] = await Promise.all([
      supabase.from("events").select("*, cover_url, gallery").eq("id", id).maybeSingle(),
      supabase
        .from("event_stats")
        .select("tickets_sold, gross_revenue, checked_in, capacity")
        .eq("event_id", id)
        .maybeSingle(),
      supabase
        .from("ticket_types")
        .select("id, event_id, name, description, price, quantity, access_level, is_active")
        .eq("event_id", id)
        .order("position", { ascending: true }),
    ]);

    eventData = data;
    stats = (statsRow as EventStatsRow | null) ?? null;
    eventTickets = (tickets ?? []).map((ticket) => ({
      id: ticket.id,
      eventId: ticket.event_id,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      quantity: ticket.quantity,
      accessLevel: (ticket.access_level || "standard") as "standard" | "vip" | "vvip",
      isActive: ticket.is_active,
    }));
  } catch {
    // La page reste utilisable si les données sont partielles
  }

  // Événement introuvable (identifiant inexistant ou non autorisé)
  if (!eventData) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <ButtonLink href="/org/evenements" variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-1.5" /> Retour à mes événements
          </ButtonLink>
        </div>
        <EmptyState
          title="Événement introuvable"
          description="Cet événement n'existe pas en base ou ne dépend pas d'une organisation que vous administrez."
          action={<ButtonLink href="/org/evenements/nouveau">Créer un événement</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full">
      <OrgEventDetailEditor
        id={id}
        initialTitle={eventData.title}
        initialDescription={eventData.description ?? ""}
        initialCategory={eventData.category ?? "concerts"}
        initialVenue={eventData.venue_name ?? ""}
        initialCity={eventData.city ?? "Abidjan"}
        initialStatus={eventData.status}
        initialSlug={eventData.slug}
        initialStartAt={toDateTimeLocalValue(eventData.start_at)}
        initialEndAt={toDateTimeLocalValue(eventData.end_at)}
        initialCapacity={eventData.capacity ?? null}
        initialCoverUrl={eventData.cover_url ?? null}
        initialGalleryUrls={eventData.gallery ?? []}
        stats={stats}
        initialTickets={eventTickets}
      />
    </div>
  );
}
