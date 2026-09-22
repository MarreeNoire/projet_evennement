import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import { AccessLevelBadge, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CURRENCY_LABEL, getCategoryLabel } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

/* =============================================================================
   Carte d'événement
   --------------------------------------------------------------------------
   Une seule source de vérité visuelle, réutilisée sur l'accueil, l'explorer et
   les salons. L'information prix/date/lieu est en texte (jamais couleur seule),
   l'image a un repli élégant si absente.
   ========================================================================== */

export function priceLabel(event: Pick<PublishedEventView, "min_price" | "max_price">): string {
  if (event.min_price <= 0 && event.max_price <= 0) return "Gratuit";
  if (event.min_price === event.max_price) return `${formatNumber(event.min_price)} ${CURRENCY_LABEL}`;
  return `dès ${formatNumber(event.min_price)} ${CURRENCY_LABEL}`;
}

export function EventCard({ event }: { event: PublishedEventView }) {
  return (
    <Link
      href={`/evenements/${event.slug}`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={`${event.title} — ${formatDate(event.start_at)} à ${event.city}`}
    >
      <Card interactive className="h-full overflow-hidden">
        <div className="relative aspect-16/9 overflow-hidden bg-bg-muted">
          {event.cover_url ? (
            <Image
              src={event.cover_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center bg-gradient-to-br from-brand-600 via-brand-800 to-ink-900"
            >
              <span className="font-display text-4xl font-bold text-white/80">
                {event.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge variant="overlay">{getCategoryLabel(event.category)}</Badge>
          </div>
          {event.min_price <= 0 ? (
            <div className="absolute top-3 right-3">
              <Badge variant="overlay">Gratuit</Badge>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatDate(event.start_at)}
          </p>
          <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug group-hover:text-primary">
            {event.title}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-fg-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {event.venue_name ? `${event.venue_name} · ` : ""}
              {event.city}
            </span>
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold tabular-nums">{priceLabel(event)}</p>
            {event.organizer_verified ? (
              <span className="text-xs text-fg-subtle" title="Organisateur vérifié">
                ✓ {event.organizer_name}
              </span>
            ) : (
              <span className="truncate text-xs text-fg-subtle">{event.organizer_name}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* Grille de cartes : accueil + explorer partagent la même mise en page. */

export function EventGrid({ events }: { events: PublishedEventView[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

/* Pastille rappelant quel niveau d'accès débloque un type de billet. */

export function TicketAccessHint({ level }: { level: string }) {
  return <AccessLevelBadge level={level} />;
}
