"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./unified-event-carousel.module.css";

type UnifiedEventCarouselProps = {
  children: ReactNode;
  label: string;
  trackClassName?: string;
  showControls?: boolean;
};

export function UnifiedEventCarousel({
  children,
  label,
  trackClassName,
  showControls = true,
}: UnifiedEventCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    setOverflowing(maxScroll > 2);
    setCanGoBack(track.scrollLeft > 2);
    setCanGoForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateEdges();
    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(track);
    for (const child of track.children) resizeObserver.observe(child);

    const mutationObserver = new MutationObserver(updateEdges);
    mutationObserver.observe(track, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"],
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children, updateEdges]);

  const scroll = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const firstVisibleCard = [...track.children].find((child) => {
      if (!(child instanceof HTMLElement) || child.hidden) return false;
      return child.getBoundingClientRect().right > track.getBoundingClientRect().left + 2;
    });
    const style = getComputedStyle(track);
    const gap = Number.parseFloat(style.columnGap || style.gap) || 0;
    const distance = firstVisibleCard instanceof HTMLElement
      ? firstVisibleCard.getBoundingClientRect().width + gap
      : track.clientWidth * 0.82;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({
      left: direction * distance,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }, []);

  return (
    <div className={styles.carousel}>
      {showControls && overflowing ? (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.button}
            aria-label="Événements précédents"
            title="Événements précédents"
            disabled={!canGoBack}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.button}
            aria-label="Événements suivants"
            title="Événements suivants"
            disabled={!canGoForward}
            onClick={() => scroll(1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <div
        ref={trackRef}
        className={`${styles.track} ${trackClassName ?? ""}`.trim()}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={updateEdges}
      >
        {children}
      </div>
    </div>
  );
}