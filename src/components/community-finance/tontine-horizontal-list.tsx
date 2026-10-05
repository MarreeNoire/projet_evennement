"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, CircleDollarSign, Users, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PublicStorageImage } from "@/components/ui/public-storage-image";

export type TontineItem = {
  id: string;
  title: string;
  cover_url: string | null;
  contribution_amount: number;
  currency: string;
  starts_on: string;
  status: "active" | "completed" | "cancelled";
  membership?: { status: "invited" | "active" | "declined"; role: "owner" | "member" };
  members?: {
    user_id: string;
    status: string;
    profile?: { display_name: string; avatar_url: string | null } | null;
  }[];
  latestCycle?: { cycle_number: number; beneficiary_user_id: string | null; status: string } | null;
};

interface TontineHorizontalListProps {
  tontines: TontineItem[];
}

export function TontineHorizontalList({ tontines }: TontineHorizontalListProps) {
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
  }, [updatePosition, tontines.length]);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    const firstChild = track?.firstElementChild;
    if (!track || !firstChild) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    const step = firstChild.getBoundingClientRect().width + gap;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({ left: step * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (tontines.length === 0) return null;

  return (
    <div className="relative group/tontines-list min-w-0">
      {/* Conteneur de défilement horizontal */}
      <div
        ref={trackRef}
        role="region"
        aria-label="Liste des tontines"
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 pt-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:scroll-auto"
      >
        {tontines.map((tontine) => {
          const activeMembersCount = tontine.members
            ? tontine.members.filter((m) => m.status === "active").length
            : 0;

          return (
            <div
              key={tontine.id}
              className="w-[84vw] min-w-[17rem] sm:w-[22rem] md:w-[24rem] shrink-0 snap-start"
            >
              <Link
                href={`/tontines/${tontine.id}`}
                className="group border-border bg-surface hover:border-accent flex h-full flex-col justify-between overflow-hidden border border-t-2 border-t-accent transition-colors duration-150"
              >
                <div className="bg-bg-muted border-border relative aspect-16/10 overflow-hidden border-b">
                  {tontine.cover_url ? (
                    <PublicStorageImage
                      src={tontine.cover_url}
                      alt={`Couverture de ${tontine.title}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="bg-accent/10 flex size-full items-center justify-center p-6 text-center">
                      <span className="font-display text-accent-solid-fg text-2xl font-bold">
                        {tontine.title.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge variant={tontine.status === "active" ? "neutral" : "warning"}>
                      {tontine.status === "active" ? "En cours" : "Terminée"}
                    </Badge>
                    {tontine.membership?.status === "invited" ? (
                      <Badge variant="warning">Invitation</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                  <h3 className="text-fg group-hover:text-accent line-clamp-2 text-base font-bold transition-colors sm:text-lg">
                    {tontine.title}
                  </h3>

                  <div className="text-fg-muted space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-fg">
                      <CircleDollarSign className="size-4 text-accent" />
                      {Number(tontine.contribution_amount).toLocaleString("fr-FR")} F CFA / mois
                    </div>
                    {activeMembersCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {activeMembersCount} membres actifs
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      Depuis le {new Date(`${tontine.starts_on}T12:00:00`).toLocaleDateString("fr-FR")}
                    </div>
                  </div>

                  <div className="border-border mt-auto flex items-center justify-between border-t pt-3 text-xs font-semibold">
                    <span className="text-fg-subtle">Tontine collective</span>
                    <span className="text-accent inline-flex items-center gap-1">
                      Voir la tontine <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Boutons de navigation (précédent / suivant) */}
      {tontines.length > 1 ? (
        <div className="pointer-events-none absolute -inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between z-10">
          <button
            type="button"
            aria-label="Tontines précédentes"
            onClick={() => scroll(-1)}
            disabled={!canGoBack}
            className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-accent-solid hover:text-accent-solid-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Tontines suivantes"
            onClick={() => scroll(1)}
            disabled={!canGoForward}
            className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-accent-solid hover:text-accent-solid-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
