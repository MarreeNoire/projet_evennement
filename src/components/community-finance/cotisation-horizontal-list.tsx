"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarClock, Users, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PublicStorageImage } from "@/components/ui/public-storage-image";

export type CotisationItem = {
  id: string;
  title: string;
  cover_url: string | null;
  description: string;
  target_amount: number | null;
  fixed_amount: number | null;
  ends_at: string | null;
  currency?: string;
  totalAmount: number;
  contributorCount: number;
};

interface CotisationHorizontalListProps {
  cotisations: CotisationItem[];
}

export function CotisationHorizontalList({ cotisations }: CotisationHorizontalListProps) {
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
  }, [updatePosition, cotisations.length]);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    const firstChild = track?.firstElementChild;
    if (!track || !firstChild) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    const step = firstChild.getBoundingClientRect().width + gap;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({ left: step * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (cotisations.length === 0) return null;

  return (
    <div className="relative group/cotisations-list min-w-0">
      {/* Conteneur de défilement horizontal */}
      <div
        ref={trackRef}
        role="region"
        aria-label="Liste des cotisations et collectes"
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 pt-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:scroll-auto"
      >
        {cotisations.map((campaign) => {
          const progress = campaign.target_amount
            ? Math.min(100, Math.round((campaign.totalAmount / Number(campaign.target_amount)) * 100))
            : null;

          return (
            <div
              key={campaign.id}
              className="w-[84vw] min-w-[17rem] sm:w-[22rem] md:w-[24rem] shrink-0 snap-start"
            >
              <Link
                href={`/cotisations/${campaign.id}`}
                className="group border-border bg-surface hover:border-success flex h-full flex-col justify-between overflow-hidden border border-t-2 border-t-success transition-colors duration-150"
              >
                <div className="bg-bg-muted border-border relative aspect-16/10 overflow-hidden border-b">
                  {campaign.cover_url ? (
                    <PublicStorageImage
                      src={campaign.cover_url}
                      alt={`Couverture de ${campaign.title}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="bg-success/10 flex size-full items-center justify-center p-6 text-center">
                      <span className="font-display text-success text-2xl font-bold">
                        {campaign.title.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {campaign.fixed_amount ? (
                      <Badge variant="neutral">
                        {Number(campaign.fixed_amount).toLocaleString("fr-FR")} F fixes
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Montant libre</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                  <h3 className="text-fg group-hover:text-success line-clamp-2 text-base font-bold transition-colors sm:text-lg">
                    {campaign.title}
                  </h3>

                  <p className="text-fg-muted line-clamp-2 text-xs leading-relaxed">
                    {campaign.description}
                  </p>

                  <div className="mt-auto space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-fg tabular-nums text-sm">
                        {Number(campaign.totalAmount).toLocaleString("fr-FR")} F CFA
                      </span>
                      <span className="text-fg-muted flex items-center gap-1">
                        <Users className="size-3.5" />
                        {campaign.contributorCount}
                      </span>
                    </div>

                    {progress !== null ? (
                      <div className="space-y-1">
                        <div className="bg-bg-muted h-1.5 overflow-hidden rounded-full">
                          <div
                            className="bg-success h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-2xs text-fg-muted text-right">
                          {progress}% · objectif {Number(campaign.target_amount).toLocaleString("fr-FR")} F
                        </p>
                      </div>
                    ) : (
                      <p className="text-fg-muted text-2xs">Collecte sans objectif fixe</p>
                    )}
                  </div>

                  <div className="border-border mt-3 flex items-center justify-between border-t pt-3 text-xs font-semibold">
                    {campaign.ends_at ? (
                      <span className="text-fg-muted flex items-center gap-1 text-2xs">
                        <CalendarClock className="size-3" />
                        Jusqu&apos;au {new Date(campaign.ends_at).toLocaleDateString("fr-FR")}
                      </span>
                    ) : (
                      <span className="text-fg-subtle">Collecte ouverte</span>
                    )}
                    <span className="text-success inline-flex items-center gap-1">
                      Contribuer <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Boutons de navigation (précédent / suivant) */}
      {cotisations.length > 1 ? (
        <div className="pointer-events-none absolute -inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between z-10">
          <button
            type="button"
            aria-label="Collectes précédentes"
            onClick={() => scroll(-1)}
            disabled={!canGoBack}
            className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-success hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Collectes suivantes"
            onClick={() => scroll(1)}
            disabled={!canGoForward}
            className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-success hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
