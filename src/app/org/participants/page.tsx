import { Users } from "lucide-react";

import { Alert, EmptyState } from "@/components/ui/states";
import { OrgParticipantsTable, type ParticipantRow } from "@/components/events/org-participants-table";
import { getOrganizerEvents } from "@/lib/events/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Participants | Espace Organisateur | Event",
  description: "Consultez et exportez les participants de vos événements.",
};

export default async function OrgParticipantsPage() {
  const events = await getOrganizerEvents();
  const eventIds = events.map((event) => event.id);

  if (!eventIds.length) {
    return <EmptyState icon={<Users />} title="Aucun événement" description="Les participants apparaîtront ici dès que vos événements auront des billets." />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id, reference, event_id, ticket_type_id, user_id, status, access_level, holder_name, checked_in_at, created_at")
    .in("event_id", eventIds)
    .in("status", ["paid", "used"])
    .order("created_at", { ascending: false });

  if (error) {
    return <Alert tone="danger" title="Participants indisponibles">Le chargement de la liste a échoué. Réessaie dans quelques instants.</Alert>;
  }

  const eventNames = new Map(events.map((event) => [event.id, event.title]));
  const [{ data: types }, { data: profileNames }] = await Promise.all([
    supabase.from("ticket_types").select("id, name").in("event_id", eventIds),
    supabase.from("profiles").select("id, display_name, full_name").in("id", [...new Set((tickets ?? []).map((ticket) => ticket.user_id))]),
  ]);
  const ticketTypeNames = new Map((types ?? []).map((type) => [type.id, type.name]));
  const names = new Map((profileNames ?? []).map((profile) => [profile.id, profile.full_name || profile.display_name]));

  const participants: ParticipantRow[] = (tickets ?? []).map((ticket) => ({
    id: ticket.id,
    name: ticket.holder_name || names.get(ticket.user_id) || "Participant",
    eventName: eventNames.get(ticket.event_id) || "Événement",
    ticketType: ticketTypeNames.get(ticket.ticket_type_id) || "Billet",
    reference: ticket.reference,
    accessLevel: ticket.access_level,
    checkedIn: Boolean(ticket.checked_in_at) || ticket.status === "used",
  }));

  return <OrgParticipantsTable participants={participants} />;
}
