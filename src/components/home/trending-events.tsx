"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Calendar, MapPin, Ticket } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { formatEventDate, formatEventPrice } from "./home-data";
import styles from "./trending-events.module.css";
import type { PublishedEventView } from "@/types/database";

interface TrendingEventsProps {
  events?: PublishedEventView[];
}

export function TrendingEvents({ events = [] }: TrendingEventsProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const displayEvents = events;

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScrollBack(rail.scrollLeft > 2);
    setCanScrollForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      rail.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [displayEvents.length, updateScrollState]);

  if (events.length === 0) return null;

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.82,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <section aria-labelledby="trending-heading" className="border-border py-12 md:py-16 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <h2 id="trending-heading" className="text-fg font-display text-xl font-bold tracking-tight sm:text-2xl">
              Prochaines sorties
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div aria-label="Faire défiler les sorties" className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                disabled={!canScrollBack}
                aria-label="Sorties précédentes"
                className="border-border-strong text-fg hover:bg-primary-subtle disabled:text-fg-subtle grid size-10 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                disabled={!canScrollForward}
                aria-label="Sorties suivantes"
                className="border-border-strong text-fg hover:bg-primary-subtle disabled:text-fg-subtle grid size-10 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
            <Link
              href="/explorer?sort=date_asc"
              className="text-fg-muted hover:text-primary group inline-flex min-h-10 items-center gap-1 text-sm font-semibold transition-colors"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        <div
          ref={railRef}
          className={styles.rail}
          role="region"
          aria-label="Liste des prochaines sorties"
          aria-describedby="trending-scroll-hint"
          tabIndex={0}
        >
          {displayEvents.map((event) => {
            const image = event.cover_url ?? event.gallery?.[0];
            const dateInfo = formatEventDate(event.start_at);
            const priceLabel = formatEventPrice(event);

            return (
              <article
                key={event.id}
                className={`${styles.event} event-card border-border bg-surface-raised group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg`}
              >
                <Link
                  href={`/evenements/${event.slug}`}
                  className="relative aspect-[3/4] w-full overflow-hidden bg-surface-sunken"
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
                    <div className="flex size-full flex-col justify-end bg-stone-900 p-5 text-white">
                      <span className="text-accent text-xs font-semibold">
                        {event.category}
                      </span>
                      <h3 className="mt-1 font-display text-lg font-bold">
                        {event.title}
                      </h3>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 z-10">
                    <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/10 uppercase tracking-wider">
                      {dateInfo.weekday} {dateInfo.dayMonth}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-neutral-900 dark:text-white shadow-sm">
                      <MapPin className="text-accent size-3" />
                      <span>{event.city}</span>
                    </span>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                      <Calendar className="text-primary size-3.5" />
                      <span>{dateInfo.time}</span>
                      <span>·</span>
                      <span className="truncate">{event.venue_name || event.city}</span>
                    </div>

                    <h3 className="text-fg font-display line-clamp-2 text-base font-bold transition-colors group-hover:text-primary">
                      <Link href={`/evenements/${event.slug}`}>{event.title}</Link>
                    </h3>
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
        <p id="trending-scroll-hint" className="text-fg-subtle mt-1 text-[0.8125rem] sm:hidden">
          Fais glisser pour découvrir les autres sorties <span aria-hidden="true">→</span>
        </p>
      </div>
    </section>
  );
}
