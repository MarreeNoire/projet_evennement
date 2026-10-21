"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Calendar } from "lucide-react";

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
                className="border-border text-fg-muted hover:border-border-strong hover:text-fg disabled:text-fg-subtle grid size-9 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                disabled={!canScrollForward}
                aria-label="Sorties suivantes"
                className="border-border text-fg-muted hover:border-border-strong hover:text-fg disabled:text-fg-subtle grid size-9 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
            <Link
              href="/explorer?sort=date_asc"
              className="text-fg-muted hover:text-fg group inline-flex min-h-10 items-center gap-1 text-sm font-semibold transition-colors"
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
                className={`${styles.event} group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200 hover:border-border-strong`}
              >
                <Link
                  href={`/evenements/${event.slug}`}
                  aria-label={`Voir ${event.title}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-bg-subtle"
                >
                  {image ? (
                    <PublicStorageImage
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 22vw, (min-width: 900px) 30vw, (min-width: 600px) 46vw, 80vw"
                      quality={72}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="text-fg-subtle flex size-full items-end p-4 text-[11px] font-semibold tracking-[0.14em] uppercase">
                      {event.category}
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <p className="text-fg-subtle flex items-center gap-1.5 text-xs">
                    <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {dateInfo.weekday} {dateInfo.dayMonth} · {dateInfo.time}
                    </span>
                  </p>

                  <h3 className="text-fg font-display line-clamp-2 text-[0.9375rem] leading-snug font-semibold">
                    <Link
                      href={`/evenements/${event.slug}`}
                      className="decoration-border-strong underline-offset-4 hover:underline"
                    >
                      {event.title}
                    </Link>
                  </h3>

                  <p className="text-fg-muted truncate text-xs">
                    {event.venue_name || event.city}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <span className="text-fg text-sm font-semibold">{priceLabel}</span>
                    <Link
                      href={`/evenements/${event.slug}/billets`}
                      className="text-fg-muted hover:text-fg inline-flex shrink-0 items-center gap-1 text-xs font-semibold transition-colors"
                    >
                      Réserver
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
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
