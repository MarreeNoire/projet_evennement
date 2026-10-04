"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Coins,
  Users,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PublicStorageImage } from "@/components/ui/public-storage-image";

type Campaign = {
  id: string;
  title: string;
  cover_url: string | null;
  description: string;
  target_amount: number | null;
  fixed_amount: number | null;
  ends_at: string | null;
  currency: string;
  totalAmount: number;
  contributorCount: number;
  creator: { display_name: string; avatar_url: string | null } | null;
};

export function CotisationList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"horizontal" | "list">("horizontal");

  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/cotisations", { cache: "no-store" });
        const data = (await response.json()) as { campaigns?: Campaign[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Les collectes ne sont pas disponibles.");
        if (active) setCampaigns(data.campaigns ?? []);
        if (active) setError("");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 20_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const updatePosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanGoBack(track.scrollLeft > 2);
    setCanGoForward(track.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    if (viewMode !== "horizontal") return;
    const track = trackRef.current;
    if (!track || campaigns.length === 0) return;

    updatePosition();
    track.addEventListener("scroll", updatePosition, { passive: true });
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(track);
    if (track.firstElementChild) resizeObserver.observe(track.firstElementChild);

    return () => {
      track.removeEventListener("scroll", updatePosition);
      resizeObserver.disconnect();
    };
  }, [updatePosition, campaigns.length, viewMode]);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    const firstChild = track?.firstElementChild;
    if (!track || !firstChild) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    const step = firstChild.getBoundingClientRect().width + gap;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({ left: step * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (loading) return <p className="text-fg-muted py-12 text-sm">Chargement des collectes…</p>;
  if (error)
    return (
      <p role="alert" className="text-danger py-8 text-sm">
        {error}
      </p>
    );
  if (!campaigns.length)
    return (
      <div className="border-border border-y py-12">
        <Coins className="text-primary mb-4 size-8" aria-hidden="true" />
        <h2 className="font-display text-2xl font-semibold">Aucune collecte ouverte</h2>
        <p className="text-fg-muted mt-2 max-w-lg text-sm leading-relaxed">
          Les collectes publiées apparaîtront ici. Tu peux lancer la tienne pour réunir des
          contributions autour d’un projet.
        </p>
        <ButtonLink href="/cotisations/nouvelle" className="mt-5">
          Créer une collecte
        </ButtonLink>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Bascule de vue */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xs font-semibold text-fg-muted">
          {campaigns.length} collecte{campaigns.length > 1 ? "s" : ""} ouverte{campaigns.length > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1 bg-bg-muted p-1 rounded-md">
          <button
            type="button"
            onClick={() => setViewMode("horizontal")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === "horizontal"
                ? "bg-surface text-fg shadow-sm font-bold"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <SlidersHorizontal className="size-3.5" /> Défilement
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === "list"
                ? "bg-surface text-fg shadow-sm font-bold"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            <LayoutGrid className="size-3.5" /> Liste
          </button>
        </div>
      </div>

      {viewMode === "horizontal" ? (
        <div className="relative group/cotisation-dash min-w-0 py-2">
          <div
            ref={trackRef}
            role="region"
            aria-label="Liste des collectes en défilement horizontal"
            tabIndex={0}
            className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 pt-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:scroll-auto"
          >
            {campaigns.map((campaign) => {
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
                    className="group border-border bg-surface hover:border-success flex h-full flex-col justify-between rounded-xl border p-5 transition-all hover:shadow-md"
                  >
                    <div>
                      {campaign.cover_url ? (
                        <div className="bg-bg-muted relative mb-4 aspect-video overflow-hidden rounded-lg">
                          <PublicStorageImage
                            src={campaign.cover_url}
                            alt={`Couverture de ${campaign.title}`}
                            fill
                            sizes="384px"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {campaign.fixed_amount ? (
                          <Badge variant="neutral" className="text-2xs">
                            {Number(campaign.fixed_amount).toLocaleString("fr-FR")} F fixes
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-2xs">Montant libre</Badge>
                        )}
                        {campaign.ends_at ? (
                          <span className="text-2xs text-fg-muted flex items-center gap-1">
                            <CalendarClock className="size-3" />
                            {new Date(campaign.ends_at).toLocaleDateString("fr-FR")}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="font-display group-hover:text-success text-base font-bold transition-colors line-clamp-1">
                        {campaign.title}
                      </h3>
                      <p className="text-fg-muted mt-1 text-xs line-clamp-2">
                        {campaign.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-border/60 border-t flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-fg tabular-nums text-sm">
                          {Number(campaign.totalAmount).toLocaleString("fr-FR")} F CFA
                        </span>
                        <span className="text-fg-muted flex items-center gap-1">
                          <Users className="size-3.5" />
                          {campaign.contributorCount} contribution{campaign.contributorCount === 1 ? "" : "s"}
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
                        <p className="text-fg-muted text-2xs">Sans objectif fixe</p>
                      )}

                      <span className="text-success mt-2 inline-flex items-center gap-1 text-xs font-semibold justify-end">
                        Contribuer{" "}
                        <ArrowRight
                          className="size-3.5 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {campaigns.length > 1 ? (
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
      ) : (
        <ul className="divide-border border-border divide-y border-y">
          {campaigns.map((campaign) => {
            const progress = campaign.target_amount
              ? Math.min(100, Math.round((campaign.totalAmount / Number(campaign.target_amount)) * 100))
              : null;
            return (
              <li key={campaign.id}>
                <Link
                  href={`/cotisations/${campaign.id}`}
                  className={`group hover:bg-bg-muted/50 grid gap-4 py-6 transition-colors sm:px-3 ${campaign.cover_url ? "sm:grid-cols-[11rem_minmax(0,1fr)_12rem]" : "sm:grid-cols-[minmax(0,1fr)_12rem]"}`}
                >
                  {campaign.cover_url ? (
                    <div className="bg-bg-muted relative aspect-video overflow-hidden rounded-lg">
                      <PublicStorageImage
                        src={campaign.cover_url}
                        alt={`Couverture de ${campaign.title}`}
                        fill
                        sizes="176px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 sm:col-span-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display group-hover:text-primary text-xl font-semibold">
                        {campaign.title}
                      </h2>
                      {campaign.fixed_amount ? (
                        <Badge variant="neutral">
                          {Number(campaign.fixed_amount).toLocaleString("fr-FR")} F fixes
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Montant libre</Badge>
                      )}
                    </div>
                    <p className="text-fg-muted mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed">
                      {campaign.description}
                    </p>
                    <div className="text-fg-muted mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                      {campaign.creator ? (
                        <span className="inline-flex items-center gap-2">
                          <Avatar
                            src={campaign.creator.avatar_url}
                            name={campaign.creator.display_name}
                            size="xs"
                          />
                          {campaign.creator.display_name}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" aria-hidden="true" />
                        {campaign.contributorCount} contribution
                        {campaign.contributorCount === 1 ? "" : "s"}
                      </span>
                      {campaign.ends_at ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="size-3.5" aria-hidden="true" />
                          Jusqu’au {new Date(campaign.ends_at).toLocaleDateString("fr-FR")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-2 sm:pl-4">
                    <p className="text-xl font-semibold tabular-nums">
                      {Number(campaign.totalAmount).toLocaleString("fr-FR")}{" "}
                      <span className="text-xs font-medium">F CFA</span>
                    </p>
                    {progress !== null ? (
                      <>
                        <div
                          role="progressbar"
                          aria-label={`Progression de ${campaign.title}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress}
                          className="bg-bg-muted h-2 overflow-hidden"
                        >
                          <div
                            className="bg-primary h-full transition-[width] duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-fg-muted text-xs">
                          {progress}% · objectif{" "}
                          {Number(campaign.target_amount).toLocaleString("fr-FR")} F
                        </p>
                      </>
                    ) : (
                      <p className="text-fg-muted text-xs">Collecte sans objectif</p>
                    )}
                    <span className="text-primary mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                      Contribuer{" "}
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
