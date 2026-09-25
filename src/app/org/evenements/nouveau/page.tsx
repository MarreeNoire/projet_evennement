import { ArrowLeft } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { CreateEventForm } from "@/components/events/create-event-form";

export const metadata = {
  title: "Créer un Événement | Espace Organisateur | Rassemble",
  description: "Formulaire de création d'un nouvel événement.",
};

export default async function NouveauEvenementPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <ButtonLink href="/org/evenements" variant="ghost" size="sm">
          <ArrowLeft className="size-4" />
        </ButtonLink>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Créer un événement</h1>
          <p className="text-sm text-fg-muted">
            Remplissez les informations principales pour lancer votre événement.
          </p>
        </div>
      </div>

      <CreateEventForm />
    </div>
  );
}
