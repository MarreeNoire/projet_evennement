import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { getOrganizerEvents } from "@/lib/events/queries";
import { OrgEventsList } from "@/components/events/org-events-list";

export const metadata = {
  title: "Mes Événements | Espace Organisateur | Event",
  description: "Gestion de vos événements publiés et brouillons.",
};

export default async function OrgEvenementsPage() {
  const events = await getOrganizerEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Gestion des Événements</h1>
          <p className="text-sm text-fg-muted">
            Créez, modifiez et suivez l&apos;état de vos événements.
          </p>
        </div>
        <ButtonLink href="/org/evenements/nouveau">
          <Plus className="mr-2 size-4" /> Nouvel événement
        </ButtonLink>
      </div>

      <OrgEventsList initialEvents={events} />
    </div>
  );
}
