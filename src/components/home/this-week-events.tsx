"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, MapPin, Ticket } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { formatEventDate, formatEventPrice, getRelativeTimeTag } from "./home-data";
import type { PublishedEventView } from "@/types/database";

interface ThisWeekEventsProps {
  events?: PublishedEventView[];
}

export function ThisWeekEvents({ events = [] }: ThisWeekEventsProps) {
  const now = Date.now();
  const next7Days = now + 7 * 24 * 3600 * 1000;

  // Filtrer STRICTEMENT les événements réels des 7 prochains jours
  const thisWeekList = events.filter((e) => {
    const time = new Date(e.start_at).getTime();
    return time >= now - 12 * 3600 * 1000 && time <= next7Days;
  });

  // S'il n'y a aucun événement cette semaine, on masque la section proprement
  if (thisWeekList.length === 0) return null;

  const displayList = thisWeekList.slice(0, 4);

  return (
    <section aria-labelledby="this-week-heading" className="border-border py-12 md:py-16 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 id="this-week-heading" className="text-fg font-display text-xl font-bold tracking-tight sm:text-2xl">
              Cette semaine
            </h2>
          </div>
          <Link
            href="/explorer?sort=date_asc"
            className="text-fg-muted hover:text-primary group inline-flex items-center gap-1 text-sm font-semibold transition-colors"
          >
            <span>Voir tout</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Grille des événements réels de cette semaine */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayList.map((event) => {
            const image = event.cover_url ?? event.gallery?.[0];
            const dateInfo = formatEventDate(event.start_at);
            const priceLabel = formatEventPrice(event);
            const timeTag = getRelativeTimeTag(event.start_at);

            return (
              <article
                key={event.id}
                className="border-border bg-surface-raised group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  href={`/evenements/${event.slug}`}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken"
                >
                  {image ? (
                    <PublicStorageImage
                      src={image}
                      alt={event.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      quality={80}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-end bg-stone-900 p-4 text-white">
                      <span className="font-display font-bold">{event.title}</span>
                    </div>
                  )}

                  {/* Badge timing relatif réel */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-accent text-fg-inverted rounded-full px-2.5 py-1 text-xs font-bold shadow-sm">
                      {timeTag}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/10 uppercase tracking-wider">
                      {event.city}
                    </span>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                      <Calendar className="text-primary size-3.5" />
                      <span>{dateInfo.fullBadge}</span>
                    </div>

                    <h3 className="text-fg font-display line-clamp-2 text-base font-bold transition-colors group-hover:text-primary">
                      <Link href={`/evenements/${event.slug}`}>{event.title}</Link>
                    </h3>

                    <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <MapPin className="size-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{event.venue_name || event.city}</span>
                    </div>
                  </div>

                  <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
                    <div>
                      <span className="text-fg-subtle block text-xs font-medium">
                        Tarif
                      </span>
                      <span className="text-fg text-sm font-extrabold">
                        {priceLabel}
                      </span>
                    </div>

                    <Link
                      href={`/evenements/${event.slug}/billets`}
                      className="bg-primary-solid text-primary-solid-fg hover:bg-primary-solid-hover inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors"
                    >
                      <Ticket className="size-3.5" />
                      <span>Réserver</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
