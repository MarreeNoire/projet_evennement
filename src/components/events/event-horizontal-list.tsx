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
    <div className="group/events-list relative min-w-0">
      {/* Conteneur de défilement horizontal */}
      <div
        ref={trackRef}
        role="region"
        aria-label="Liste des événements à venir"
        tabIndex={0}
        className="no-scrollbar focus-visible:outline-primary flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pt-1 pb-2 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:scroll-auto"
      >
        {events.map((event, index) => (
          <div
            key={event.id}
            className="event-card-reveal w-[78vw] min-w-[16rem] shrink-0 snap-start sm:w-[20rem] md:w-[21rem]"
            style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>

      {/* Boutons de navigation (précédent / suivant) */}
      {events.length > 1 ? (
        <div className="pointer-events-none absolute -inset-x-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between">
          <button
            type="button"
            aria-label="Événements précédents"
            onClick={() => scroll(-1)}
            disabled={!canGoBack}
            className="border-border bg-surface/95 text-fg hover:bg-primary focus-visible:outline-primary pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border shadow-md transition-all hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Événements suivants"
            onClick={() => scroll(1)}
            disabled={!canGoForward}
            className="border-border bg-surface/95 text-fg hover:bg-primary focus-visible:outline-primary pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border shadow-md transition-all hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
