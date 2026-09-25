import { ButtonLink } from "@/components/ui/button";
import { AccessLevelBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { TicketTypeRow, PublishedEventView } from "@/types/database";

/* =============================================================================
   Billetterie : chaque type de billet est présenté comme un billet.
   Informations à gauche, perforation en pointillés, prix et action à droite.
   ========================================================================== */

export function TicketPicker({ ticketTypes, slug }: { ticketTypes: TicketTypeRow[]; slug: string }) {
  const available = ticketTypes.filter((t) => t.is_active && t.sold_count < t.quantity);

  if (available.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Billetterie</CardTitle>
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
    <section aria-labelledby="billetterie" className="flex flex-col gap-4">
      <div className="border-t border-border pt-4">
        <p className="eyebrow">Billetterie</p>
        <h2 id="billetterie" className="mt-2 font-display text-2xl font-semibold">
          Choisir mes billets
        </h2>
      </div>

      <ul className="flex flex-col gap-3">
        {available.map((type) => {
          const remaining = type.quantity - type.sold_count;
          return (
            <li
              key={type.id}
              className="flex overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-150 hover:border-border"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {type.name}
                  <AccessLevelBadge level={type.access_level} />
                </p>
                {type.description ? (
                  <p className="line-clamp-2 text-sm text-fg-muted">{type.description}</p>
                ) : null}
                {remaining <= 20 ? (
                  <p className="text-xs font-medium text-accent">Plus que {remaining} places</p>
                ) : null}
              </div>

              {/* Talon : perforation + prix + action */}
              <div className="flex shrink-0 flex-col items-stretch justify-center gap-2 border-l-2 border-dashed border-border-strong bg-surface-raised px-4 py-3 text-center">
                <p className="font-display text-lg leading-none font-semibold tabular-nums">
                  {type.price <= 0 ? "Gratuit" : formatPrice(type.price)}
                </p>
                <ButtonLink href={`/evenements/${slug}/billets?type=${type.id}`} size="sm">
                  Choisir
                </ButtonLink>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-fg-subtle">
        Paiement sécurisé par mobile money (Wave, Orange, MTN, Moov) ou carte bancaire.
      </p>
    </section>
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
    <aside
      aria-labelledby="salon-titre"
      className="flex flex-col gap-4 border-y border-border py-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">Avant, pendant, après</p>
        <h2 id="salon-titre" className="font-display text-2xl font-semibold">
          Le salon de l&apos;événement
        </h2>
        <p className="max-w-md text-sm text-fg-muted">{label} Présente-toi, pose tes questions.</p>
      </div>
      <ButtonLink href={`/evenements/${slug}/salon`} variant="secondary" className="shrink-0">
        Découvrir le salon
      </ButtonLink>
    </aside>
  );
}
