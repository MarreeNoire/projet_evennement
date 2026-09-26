import { OrgTicketTypesManager } from "@/components/events/org-ticket-types-manager";
import { getOrganizerTicketTypes } from "@/lib/events/queries";

export const metadata = {
  title: "Billetterie & Tarifs | Espace Organisateur | Event",
  description: "Configurez vos types de billets (Standard, VIP, VVIP) et quotas.",
};

export default async function OrgBilletteriePage() {
  const tickets = await getOrganizerTicketTypes();
  return <OrgTicketTypesManager initialTickets={tickets} />;
}
