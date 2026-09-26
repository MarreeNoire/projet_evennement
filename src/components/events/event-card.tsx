import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import { AccessLevelBadge } from "@/components/ui/badge";
import { CURRENCY_LABEL, getCategoryLabel } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

/* =============================================================================
   Carte d'événement
   --------------------------------------------------------------------------
   Une seule source de vérité visuelle, réutilisée sur l'accueil, l'explorer et
   les salons. Le prix, la date et le lieu sont toujours en texte (jamais la
   couleur seule). Sans image de couverture, on génère une « affiche » :
   aplat de couleur, motif géométrique et initiale en serif. La couleur est
   choisie de façon déterministe à partir du titre : deux rechargements
   donnent le même résultat, et la grille reste variée.
   ========================================================================== */

export function priceLabel(event: Pick<PublishedEventView, "min_price" | "max_price">): string {
  if (event.min_price <= 0 && event.max_price <= 0) return "Gratuit";
  if (event.min_price === event.max_price) return `${formatNumber(event.min_price)} ${CURRENCY_LABEL}`;
  return `dès ${formatNumber(event.min_price)} ${CURRENCY_LABEL}`;
}

/* ------------------------------ Bloc de date ------------------------------ */

function dateParts(value: string) {
  const date = new Date(value);
  const options = { timeZone: "Africa/Abidjan" } as const;

  return {
    day: new Intl.DateTimeFormat("fr-FR", { ...options, day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("fr-FR", { ...options, month: "short" })
      .format(date)
      .replace(".", ""),
    year: new Intl.DateTimeFormat("fr-FR", { ...options, year: "numeric" }).format(date),
  };
}

/* --------------------------------- Carte ---------------------------------- */

export function EventCard({ event }: { event: PublishedEventView }) {
  const { day, month, year } = dateParts(event.start_at);
  const gallery = Array.isArray(event.gallery) ? event.gallery : [];
  const imageUrl = event.cover_url ?? gallery[0] ?? null;

  return (
    <Link
      href={`/evenements/${event.slug}`}
      className="group block h-full focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={`${event.title}, ${formatDate(event.start_at)} à ${event.city}`}
    >
      <article className="flex h-full flex-col overflow-hidden border border-border bg-surface transition-colors duration-150 group-hover:border-primary">
        <div className="relative aspect-16/10 overflow-hidden border-b border-border bg-bg-muted">
          {imageUrl ? (
            // Les images Supabase sont servies directement pour éviter le proxy Next.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="size-full object-cover transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-fg-subtle">
              Aucune image
            </div>
          )}

          {/* Badges en superposition */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="border border-border bg-surface px-2 py-1 text-2xs font-semibold tracking-wide text-fg uppercase">
              {getCategoryLabel(event.category)}
            </span>
          </div>

        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base sm:text-lg leading-snug font-bold text-fg group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Gallery preview */}
          {gallery.length > 0 && (
            <div className="flex gap-1 mb-2">
              {gallery.slice(0, 3).map((url, index) => (
                <img
                  key={`${event.id}-gallery-${index}`}
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  width={40}
                  height={40}
                  className="rounded-md object-cover border border-border/50 bg-bg-muted"
                  style={{ flexShrink: 0 }}
                />
              ))}
            </div>
          )}

          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{`${day} ${month} ${year}`}</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{event.venue_name ? `${event.venue_name}, ` : ""}{event.city}</span>
          </p>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-sm font-bold text-fg tabular-nums">
              {priceLabel(event)}
            </span>
            <span className="flex items-center gap-1 text-xs text-fg-subtle truncate max-w-[140px]">
              {event.organizer_verified ? (
                <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary shrink-0">
                  ✓
                </span>
              ) : null}
              <span className="truncate">{event.organizer_name}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* Grille de cartes : accueil + explorer partagent la même mise en page. */

export function EventGrid({ events }: { events: PublishedEventView[] }) {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
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
