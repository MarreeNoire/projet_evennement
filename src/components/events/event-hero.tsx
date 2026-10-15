import { Avatar } from "@/components/ui/avatar";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { EventCountdown } from "@/components/events/event-countdown";
import { CalendarDays, MapPin } from "lucide-react";
import { ViewTransition } from "react";
import { getCategoryLabel } from "@/lib/constants";
import { formatDateRange } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

import { priceLabel } from "./event-card";

/* =============================================================================
   Couverture + titre d'un événement (haut de la page détail)
   --------------------------------------------------------------------------
   Mise en page d'affiche : visuel en bandeau, puis titre en grand à gauche et
   Les informations pratiques sont regroupées dans le volet de détails.
   ========================================================================== */

export function EventHero({ event }: { event: PublishedEventView }) {
  const gallery = Array.isArray(event.gallery) ? event.gallery : [];
  const images = [
    ...new Set([event.cover_url, ...gallery].filter((url): url is string => Boolean(url))),
  ].map((src, index) => ({
    id: `${event.id}-image-${index}`,
    src,
    alt: `${event.title}, photo ${index + 1}`,
  }));

  return (
    <section aria-labelledby="titre-evenement" className="flex flex-col gap-5 sm:gap-8">
      <div className="bg-bg-muted relative aspect-[16/9] overflow-hidden sm:aspect-21/9">
        {images.length > 0 ? (
          <ViewTransition name={`event-cover-${event.id}`} share="morph" default="none">
            <ImageCarousel
              images={images}
              label={`Photos de ${event.title}`}
              slideClassName="h-full w-full basis-full"
              sizes="100vw"
              quality={72}
              preloadFirstImage
              className="size-full"
            />
          </ViewTransition>
        ) : (
          <div className="text-fg-subtle flex size-full items-center justify-center text-sm">
            Aucune image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className="eyebrow">
          {getCategoryLabel(event.category)} · {priceLabel(event)}
        </p>
        <h1
          id="titre-evenement"
          className="font-display text-3xl leading-[1.08] font-semibold break-words sm:text-4xl md:text-5xl lg:text-6xl"
        >
          {event.title}
        </h1>
        {event.summary ? (
          <p className="text-fg-muted max-w-2xl line-clamp-2 text-base leading-relaxed md:text-lg">
            {event.summary}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function EventPracticalInfo({ event }: { event: PublishedEventView }) {
  return (
    <dl className="grid gap-4 border-b border-border pb-5 text-sm sm:grid-cols-3">
      <div className="border-border flex flex-col gap-1 border-b py-4">
        <dt className="eyebrow">Date</dt>
        <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
          <CalendarDays className="size-4 text-fg-subtle" aria-hidden="true" />
          <span>{formatDateRange(event.start_at, event.end_at)}</span>
          <EventCountdown startAt={event.start_at} />
        </dd>
      </div>
      <div className="border-border flex flex-col gap-1 border-b py-4">
        <dt className="eyebrow">Lieu</dt>
        <dd className="flex items-center gap-2 font-medium">
          <MapPin className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          {event.venue_name ? `${event.venue_name} · ` : ""}
          {event.city}, {event.country}
        </dd>
      </div>
      <div className="border-border flex flex-col gap-2 border-b py-4">
        <dt className="eyebrow">Organisé par</dt>
        <dd className="flex items-center gap-2.5 font-medium">
          <Avatar src={event.organizer_logo_url} name={event.organizer_name} size="sm" />
          <span>
            {event.organizer_name}
            {event.organizer_verified ? (
              <span className="text-success ml-2 text-xs font-semibold" title="Organisateur vérifié">
                ✓ vérifié
              </span>
            ) : null}
          </span>
        </dd>
      </div>
    </dl>
  );
}
