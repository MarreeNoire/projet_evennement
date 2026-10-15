import { OrgTicketTypesManager } from "@/components/events/org-ticket-types-manager";
import { getOrganizerTicketTypes } from "@/lib/events/queries";
import { getOrganizerEvents } from "@/lib/events/queries";

export const metadata = {
  title: "Billetterie & Tarifs | Espace Organisateur | Event",
  description: "Configurez vos types de billets (Standard, VIP, VVIP) et quotas.",
};

export default async function OrgBilletteriePage() {
  const [tickets, events] = await Promise.all([getOrganizerTicketTypes(), getOrganizerEvents()]);
  return <OrgTicketTypesManager initialTickets={tickets} events={events.map(({ id, title }) => ({ id, title }))} />;
}
