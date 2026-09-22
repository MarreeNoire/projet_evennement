import { Ticket, Users } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { AccessLevelBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { TicketTypeRow, PublishedEventView } from "@/types/database";

/* Billetterie : liste des types de billets disponibles. */

export function TicketPicker({ ticketTypes, slug }: { ticketTypes: TicketTypeRow[]; slug: string }) {
  const available = ticketTypes.filter((t) => t.is_active && t.sold_count < t.quantity);

  if (available.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billetterie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fg-muted">
            La billetterie est complète ou momentanément indisponible pour cet événement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="size-5" aria-hidden="true" />
          Choisir mes billets
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {available.map((type) => {
          const remaining = type.quantity - type.sold_count;
          return (
            <div key={type.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {type.name}
                  <AccessLevelBadge level={type.access_level} />
                </p>
                {type.description ? (
                  <p className="truncate text-sm text-fg-muted">{type.description}</p>
                ) : null}
                <p className="text-xs text-fg-subtle">
                  {type.price <= 0 ? "Gratuit" : formatPrice(type.price)}
                  {remaining <= 20 ? ` · plus que ${remaining} places` : ""}
                </p>
              </div>
              <ButtonLink href={`/evenements/${slug}/billets?type=${type.id}`} size="sm">
                Choisir
              </ButtonLink>
            </div>
          );
        })}
        <p className="text-xs text-fg-subtle">
          Paiement sécurisé par mobile money (Wave, Orange, MTN, Moov) ou carte bancaire.
        </p>
      </CardContent>
    </Card>
  );
}

/* Bandeau salon communautaire : rejoindre la discussion de l'événement. */

export function SalonTeaser({
  slug,
  privacy,
}: {
  slug: string;
  privacy: PublishedEventView["salon_privacy"];
}) {
  const label =
    privacy === "public"
      ? "Salon public : tout le monde peut échanger."
      : privacy === "members"
        ? "Salon réservé aux participants munis d'un billet."
        : "Salon privé sur invitation.";

  return (
    <Card className="border-primary/25 bg-primary-subtle">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface" aria-hidden="true">
          <Users className="size-5 text-primary" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-primary-subtle-fg">Le salon de l'événement</p>
          <p className="text-sm text-fg-muted">{label} Présente-toi, pose tes questions.</p>
        </div>
        <ButtonLink href={`/evenements/${slug}/salon`} variant="secondary">
          Découvrir le salon
        </ButtonLink>
      </CardContent>
    </Card>
  );
}
