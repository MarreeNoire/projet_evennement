"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { cn } from "@/lib/utils";

export interface CarouselImage {
  id: string;
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  label: string;
  /** Tailwind width for each slide, e.g. "basis-full" or "basis-[82%] sm:basis-1/2". */
  slideClassName: string;
  sizes: string;
  quality?: number;
  preloadFirstImage?: boolean;
  imageClassName?: string;
  className?: string;
  controlsClassName?: string;
}

/** Accessible, responsive image rail with native touch scrolling and arrow controls. */
export function ImageCarousel({
  images,
  label,
  slideClassName,
  sizes,
  quality = 68,
  preloadFirstImage = false,
  imageClassName,
  className,
  controlsClassName,
}: ImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);

  const updatePosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanGoBack(track.scrollLeft > 2);
    setCanGoForward(track.scrollLeft < maxScroll - 2);

    const firstSlide = track.firstElementChild;
    const step = firstSlide
      ? firstSlide.getBoundingClientRect().width + Number.parseFloat(getComputedStyle(track).columnGap || "0")
      : track.clientWidth;
    setCurrentSlide(step > 0 ? Math.min(images.length, Math.max(1, Math.round(track.scrollLeft / step) + 1)) : 1);
  }, [images.length]);

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
    const firstSlide = track?.firstElementChild;
    if (!track || !firstSlide) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    const amount = firstSlide.getBoundingClientRect().width + gap;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: amount * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (images.length === 0) return null;

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:scroll-auto"
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${index + 1} sur ${images.length}`}
            className={cn("group/image shrink-0 snap-start", slideClassName)}
          >
            <div className="bg-bg-muted border-border relative size-full overflow-hidden border">
              <PublicStorageImage
                src={image.src}
                alt={image.alt}
                className={cn(
                  "size-full object-cover transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/image:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none",
                  imageClassName,
                )}
                sizes={sizes}
                fill
                quality={quality}
                preload={preloadFirstImage && index === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <div className={cn("pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3", controlsClassName)}>
            <button
              type="button"
              aria-label="Image précédente"
              onClick={() => scroll(-1)}
              disabled={!canGoBack}
              className="pointer-events-auto inline-flex size-10 items-center justify-center border border-border bg-surface/95 text-fg transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Image suivante"
              onClick={() => scroll(1)}
              disabled={!canGoForward}
              className="pointer-events-auto inline-flex size-10 items-center justify-center border border-border bg-surface/95 text-fg transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
          <p aria-live="polite" className="sr-only">
            Image {currentSlide} sur {images.length}
          </p>
        </>
      ) : null}
    </div>
  );
}
