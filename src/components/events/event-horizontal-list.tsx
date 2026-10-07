"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { EventCard } from "@/components/events/event-card";
import type { PublishedEventView } from "@/types/database";

interface EventHorizontalListProps {
  events: PublishedEventView[];
}

export function EventHorizontalList({ events }: EventHorizontalListProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const updatePosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanGoBack(track.scrollLeft > 2);
    setCanGoForward(track.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updatePosition();
    track.addEventListener("scroll", updatePosition, { passive: true });
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(track);
    if (track.firstElementChild) resizeObserver.observe(track.firstElementChild);

    return () => {
      track.removeEventListener("scroll", updatePosition);
      resizeObserver.disconnect();
    };
  }, [updatePosition]);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    const firstChild = track?.firstElementChild;
    if (!track || !firstChild) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    const step = firstChild.getBoundingClientRect().width + gap;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({ left: step * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (events.length === 0) return null;

  return (
    <div className="relative group/events-list min-w-0">
      {/* Conteneur de défilement horizontal */}
      <div
        ref={trackRef}
        role="region"
        aria-label="Liste des événements à venir"
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 pt-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:scroll-auto"
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            className="event-card-reveal w-[84vw] min-w-[17rem] shrink-0 snap-start sm:w-[22rem] md:w-[24rem]"
            style={{ animationDelay: `${Math.min(index * 65, 390)}ms` }}
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>

      {/* Boutons de navigation (précédent / suivant) */}
      {events.length > 1 ? (
        <div className="pointer-events-none absolute -inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between z-10">
          <button
            type="button"
            aria-label="Événements précédents"
            onClick={() => scroll(-1)}
            disabled={!canGoBack}
            className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Événements suivants"
            onClick={() => scroll(1)}
            disabled={!canGoForward}
            className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
