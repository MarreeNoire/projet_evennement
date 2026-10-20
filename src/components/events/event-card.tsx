import Link from "next/link";
import { ViewTransition } from "react";
import type { CSSProperties } from "react";
import { BadgeCheck, MapPin } from "lucide-react";

import { AccessLevelBadge } from "@/components/ui/badge";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { CURRENCY_LABEL, getCategoryLabel } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";
import { EventQuickPreview } from "./event-quick-preview";

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
  if (event.min_price === event.max_price)
    return `${formatNumber(event.min_price)} ${CURRENCY_LABEL}`;
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
    <article className="event-card group border-border-strong/70 bg-surface hover:border-primary flex h-full flex-col overflow-hidden rounded-xl border transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/evenements/${event.slug}`}
        prefetch={false}
        aria-label={`${event.title}, ${formatDate(event.start_at)} à ${event.city}`}
        className="focus-visible:outline-border-focus block focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
      >
        <div className="border-border bg-bg-muted relative aspect-[16/8] overflow-hidden border-b">
          {imageUrl ? (
            <ViewTransition name={`event-cover-${event.id}`} share="morph" default="none">
              <PublicStorageImage
                src={imageUrl}
                alt=""
                className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.045] motion-reduce:transform-none"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                fill
                quality={68}
              />
            </ViewTransition>
          ) : (
            <EventPoster event={event} />
          )}

          {/* Badges en superposition */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="border-border bg-surface text-2xs text-fg rounded-md border px-2 py-1 font-semibold tracking-wide uppercase">
              {getCategoryLabel(event.category)}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-base leading-snug font-bold sm:text-lg">
            <Link
              href={`/evenements/${event.slug}`}
              prefetch={false}
              className="text-fg hover:text-primary focus-visible:outline-border-focus focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {event.title}
            </Link>
          </h3>
          <time
            dateTime={event.start_at}
            className="border-border-strong flex shrink-0 flex-col rounded-md border px-2.5 py-1 text-right"
            aria-label={`${day} ${month} ${year}`}
          >
            <span className="font-display text-primary text-xl leading-none font-bold tabular-nums">
              {day}
            </span>
            <span className="text-2xs text-fg-muted mt-1 font-semibold tracking-wide uppercase">
              {month}
            </span>
          </time>
        </div>

        {/* Gallery preview */}
        {gallery.length > 0 && (
          <div className="mb-2 flex gap-1">
            {gallery.slice(0, 3).map((url, index) => (
              <span
                key={`${event.id}-gallery-${index}`}
                className="border-border/50 bg-bg-muted size-10 shrink-0 overflow-hidden rounded-md border"
              >
                <PublicStorageImage
                  src={url}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  quality={48}
                  className="size-full object-cover"
                />
              </span>
            ))}
          </div>
        )}

        <p className="text-fg-muted flex items-center gap-2 text-xs">
          <MapPin className="text-primary size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {event.venue_name ? `${event.venue_name}, ` : ""}
            {event.city}
          </span>
        </p>

        <div className="border-border mt-auto flex items-center justify-between gap-3 border-t pt-3">
          <span className="text-fg text-sm font-bold tabular-nums">{priceLabel(event)}</span>
          <span className="text-fg-subtle flex max-w-[140px] items-center gap-1 truncate text-xs">
            {event.organizer_verified ? (
              <BadgeCheck
                className="text-primary size-4 shrink-0"
                aria-label="Organisateur vérifié"
              />
            ) : null}
            <span className="truncate">{event.organizer_name}</span>
          </span>
        </div>
        <div className="flex justify-end pt-1">
          <EventQuickPreview event={event} formattedPrice={priceLabel(event)} />
        </div>
      </div>
    </article>
  );
}

function EventPoster({ event }: { event: PublishedEventView }) {
  const palette = 1 + ([...event.title].reduce((total, char) => total + char.charCodeAt(0), 0) % 5);
  const style = {
    "--poster-bg": `var(--poster-${palette})`,
    "--poster-text": `var(--poster-${palette}-fg)`,
  } as CSSProperties;

  return (
    <div
      style={style}
      className="relative flex size-full flex-col justify-between overflow-hidden bg-(--poster-bg) p-5 text-(--poster-text) sm:p-6"
    >
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-8 size-40 rounded-full border-[18px] border-(--poster-text)"
      />
      <div className="relative flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.16em] uppercase">
        <span>{getCategoryLabel(event.category)}</span>
        <span>{event.city}</span>
      </div>
      <div className="relative max-w-[85%]">
        <span
          className="font-display block text-5xl leading-none font-semibold sm:text-6xl"
          aria-hidden="true"
        >
          {event.title.trim().charAt(0).toLocaleUpperCase("fr-FR")}
        </span>
        <span className="mt-3 line-clamp-2 block text-lg leading-tight font-semibold sm:text-xl">
          {event.title}
        </span>
      </div>
    </div>
  );
}

/* Grille de cartes : accueil + explorer partagent la même mise en page. */

export function EventGrid({ events }: { events: PublishedEventView[] }) {
  return (
    <div
      className="event-grid no-scrollbar focus-visible:outline-primary flex max-w-full min-w-0 snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 md:grid md:snap-none md:grid-cols-2 md:gap-x-6 md:gap-y-8 md:overflow-visible md:pb-0 md:focus-visible:outline-none lg:grid-cols-3"
      role="region"
      aria-label="Résultats des événements à faire défiler"
      tabIndex={0}
    >
      {events.map((event) => (
        <div
          key={event.id}
          className="event-card-reveal w-[78vw] min-w-[16rem] shrink-0 snap-start md:w-auto md:min-w-0"
        >
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}

/* Pastille rappelant quel niveau d'accès débloque un type de billet. */

export function TicketAccessHint({ level }: { level: string }) {
  return <AccessLevelBadge level={level} />;
}
