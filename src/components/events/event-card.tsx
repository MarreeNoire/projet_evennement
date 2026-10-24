import Link from "next/link";
import { ViewTransition } from "react";
import type { CSSProperties } from "react";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";

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
   les salons. La structure reprend le billet de la maquette `accueil/` : bloc de
   date en menthe, filet perforé, prix composté, action principale franche.
   La surface est un panneau de verre (voir `.event-card` dans globals.css).

   Le prix, la date et le lieu restent toujours en texte, jamais portés par la
   couleur seule. Sans image de couverture, on génère une « affiche » : aplat de
   couleur, motif géométrique et initiale en display. La couleur est choisie de
   façon déterministe à partir du titre, si bien que deux rechargements donnent
   le même résultat et que la grille reste variée.
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
  const eventHref = `/evenements/${event.slug}`;

  return (
    <article className="event-card">
      <Link
        href={eventHref}
        prefetch={false}
        aria-label={`${event.title}, ${formatDate(event.start_at)} à ${event.city}`}
        className="focus-visible:outline-border-focus block focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
      >
        <div className="event-card-media aspect-[16/10]">
          {imageUrl ? (
            <ViewTransition name={`event-cover-${event.id}`} share="morph" default="none">
              <PublicStorageImage
                src={imageUrl}
                alt=""
                className="event-card-cover size-full object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                fill
                quality={68}
              />
            </ViewTransition>
          ) : (
            <EventPoster event={event} />
          )}

          {/* Voile bas : garantit la lisibilité de la pastille de date. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(11,11,12,0.62)] to-transparent"
          />

          <span className="absolute top-3 left-3 inline-flex items-center rounded-md border border-[rgba(244,242,236,0.28)] bg-[rgba(11,11,12,0.58)] px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] text-[var(--paper)] uppercase backdrop-blur-md">
            {getCategoryLabel(event.category)}
          </span>

          <time
            dateTime={event.start_at}
            className="event-card-date absolute right-3 bottom-3"
            aria-label={`${day} ${month} ${year}`}
          >
            <span className="event-card-date-day">{day}</span>
            <span className="event-card-date-month">{month}</span>
          </time>
        </div>
      </Link>

      <div className="event-card-tear" aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="event-card-title line-clamp-2">
          <Link
            href={eventHref}
            prefetch={false}
            className="focus-visible:outline-border-focus transition-colors hover:text-(--mint-deep) focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {event.title}
          </Link>
        </h3>

        <p className="text-fg-muted flex items-center gap-1.5 text-xs">
          <MapPin className="text-(--mint-deep) size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {event.venue_name ? `${event.venue_name}, ` : ""}
            {event.city}
          </span>
        </p>

        {gallery.length > 0 ? (
          <div className="flex gap-1">
            {gallery.slice(0, 3).map((url, index) => (
              <span
                key={`${event.id}-gallery-${index}`}
                className="border-border/60 bg-bg-muted size-9 shrink-0 overflow-hidden rounded-md border"
              >
                <PublicStorageImage
                  src={url}
                  alt=""
                  width={36}
                  height={36}
                  sizes="36px"
                  quality={48}
                  className="size-full object-cover"
                />
              </span>
            ))}
          </div>
        ) : null}

        <div className="border-border mt-auto flex items-end justify-between gap-3 border-t pt-2.5">
          <span className="event-card-price">{priceLabel(event)}</span>
          <span className="text-fg-subtle flex max-w-[9rem] items-center gap-1 truncate text-[0.7rem]">
            {event.organizer_verified ? (
              <BadgeCheck
                className="text-(--mint-deep) size-3.5 shrink-0"
                aria-label="Organisateur vérifié"
              />
            ) : null}
            <span className="truncate">{event.organizer_name}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <EventQuickPreview
            event={event}
            formattedPrice={priceLabel(event)}
            buttonClassName="event-card-preview"
          />
          <Link href={`${eventHref}/billets`} className="event-card-cta ms-auto">
            Billet
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
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
      className="event-card-cover relative flex size-full flex-col justify-between overflow-hidden bg-(--poster-bg) p-5 text-(--poster-text) sm:p-6"
    >
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-8 size-40 rounded-full border-[18px] border-(--poster-text) opacity-25"
      />
      <div className="relative flex items-center justify-between gap-3 text-[0.62rem] font-bold tracking-[0.16em] uppercase">
        <span>{getCategoryLabel(event.category)}</span>
        <span>{event.city}</span>
      </div>
      <div className="relative max-w-[85%]">
        <span
          className="font-display block text-5xl leading-none font-normal sm:text-6xl"
          aria-hidden="true"
        >
          {event.title.trim().charAt(0).toLocaleUpperCase("fr-FR")}
        </span>
        <span className="mt-3 line-clamp-2 block text-sm leading-tight font-semibold">
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
