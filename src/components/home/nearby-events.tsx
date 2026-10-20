"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, MapPin, Ticket } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { formatEventDate, formatEventPrice } from "./home-data";
import type { PublishedEventView } from "@/types/database";

interface NearbyEventsProps {
  events?: PublishedEventView[];
  cities?: string[];
}

export function NearbyEvents({ events = [], cities = [] }: NearbyEventsProps) {
  // Uniquement les villes réelles avec des événements enregistrés
  const availableCities = Array.from(
    new Set([
      ...events.map((e) => e.city).filter(Boolean),
      ...cities.filter(Boolean),
    ])
  );

  const defaultCity = availableCities[0];
  const [activeCity, setActiveCity] = useState<string>(defaultCity ?? "");

  if (!defaultCity || events.length === 0) return null;

  const currentCity = activeCity || defaultCity;

  const filteredEvents = events.filter(
    (e) => e.city.toLowerCase() === currentCity.toLowerCase()
  );
  const displayEvents = filteredEvents.slice(0, 3);

  if (displayEvents.length === 0) return null;

  return (
    <section aria-labelledby="nearby-heading" className="border-border bg-bg-subtle py-12 md:py-16 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 id="nearby-heading" className="text-fg font-display text-xl font-bold tracking-tight sm:text-2xl">
              Sorties à {currentCity}
            </h2>
          </div>

          {/* Sélecteur des vraies villes existantes */}
          {availableCities.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {availableCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setActiveCity(city)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    currentCity.toLowerCase() === city.toLowerCase()
                      ? "bg-primary-solid text-primary-solid-fg shadow-sm"
                      : "bg-surface border-border text-fg-muted hover:border-border-strong border"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Événements réels de la ville */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayEvents.map((event) => {
            const image = event.cover_url ?? event.gallery?.[0];
            const dateInfo = formatEventDate(event.start_at);
            const priceLabel = formatEventPrice(event);

            return (
              <article
                key={event.id}
                className="border-border bg-surface-raised group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  href={`/evenements/${event.slug}`}
                  className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken"
                >
                  {image ? (
                    <PublicStorageImage
                      src={image}
                      alt={event.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      quality={80}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-end bg-stone-900 p-4 text-white">
                      <span className="font-display font-bold">{event.title}</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/10">
                      <MapPin className="text-accent size-3" />
                      <span>{event.city}</span>
                    </span>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                      <Calendar className="text-primary size-3.5" />
                      <span>{dateInfo.fullBadge}</span>
                    </div>

                    <h3 className="text-fg font-display line-clamp-2 text-base font-bold transition-colors group-hover:text-primary">
                      <Link href={`/evenements/${event.slug}`}>{event.title}</Link>
                    </h3>

                    {event.summary && (
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {event.summary}
                      </p>
                    )}
                  </div>

                  <div className="border-border mt-5 flex items-center justify-between border-t pt-3">
                    <div>
                      <span className="text-fg-subtle block text-xs font-medium">
                        Tarif
                      </span>
                      <span className="text-fg text-sm font-bold">
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

        <div className="mt-8 text-center">
          <Link
            href={`/explorer?city=${encodeURIComponent(currentCity)}#resultats`}
            className="text-fg-muted hover:text-primary inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            <span>Voir tous les événements à {currentCity}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
