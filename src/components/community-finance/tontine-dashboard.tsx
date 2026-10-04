"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Repeat2,
  Users,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PublicStorageImage } from "@/components/ui/public-storage-image";

type Tontine = {
  id: string;
  title: string;
  cover_url: string | null;
  contribution_amount: number;
  currency: string;
  starts_on: string;
  status: "active" | "completed" | "cancelled";
  membership: { status: "invited" | "active" | "declined"; role: "owner" | "member" };
  members: {
    user_id: string;
    status: string;
    profile: { display_name: string; avatar_url: string | null } | null;
  }[];
  latestCycle: { cycle_number: number; beneficiary_user_id: string | null; status: string } | null;
};

export function TontineDashboard() {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"horizontal" | "list">("horizontal");

  const trackRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    void fetch("/api/tontines")
      .then(async (response) => {
        const data = (await response.json()) as { tontines?: Tontine[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Impossible de charger les tontines.");
        setTontines(data.tontines ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Chargement impossible."))
      .finally(() => setLoading(false));
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
    if (!track || tontines.length === 0) return;

    updatePosition();
    track.addEventListener("scroll", updatePosition, { passive: true });
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(track);
    if (track.firstElementChild) resizeObserver.observe(track.firstElementChild);

    return () => {
      track.removeEventListener("scroll", updatePosition);
      resizeObserver.disconnect();
    };
  }, [updatePosition, tontines.length, viewMode]);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    const firstChild = track?.firstElementChild;
    if (!track || !firstChild) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    const step = firstChild.getBoundingClientRect().width + gap;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({ left: step * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (loading) return <p className="text-fg-muted py-12 text-sm">Chargement des tontines…</p>;
  if (error)
    return (
      <p role="alert" className="text-danger py-8 text-sm">
        {error}
      </p>
    );
  if (!tontines.length)
    return (
      <div className="border-border border-y py-12">
        <Repeat2 className="text-primary mb-4 size-8" aria-hidden="true" />
        <h2 className="font-display text-2xl font-semibold">Aucune tontine pour le moment</h2>
        <p className="text-fg-muted mt-2 max-w-lg text-sm leading-relaxed">
          Crée un groupe, fixe la contribution mensuelle et invite les personnes avec qui tu
          souhaites organiser une rotation.
        </p>
        <ButtonLink href="/tontines/nouvelle" className="mt-5">
          Créer une tontine
        </ButtonLink>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Bascule de vue */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xs font-semibold text-fg-muted">
          {tontines.length} tontine{tontines.length > 1 ? "s" : ""}
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
        <div className="relative group/tontine-dash min-w-0 py-2">
          <div
            ref={trackRef}
            role="region"
            aria-label="Liste des tontines en défilement horizontal"
            tabIndex={0}
            className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 pt-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:scroll-auto"
          >
            {tontines.map((tontine) => {
              const owner = tontine.membership.role === "owner";
              const beneficiary = tontine.latestCycle?.beneficiary_user_id
                ? tontine.members.find(
                    (member) => member.user_id === tontine.latestCycle?.beneficiary_user_id,
                  )?.profile?.display_name
                : null;
              return (
                <div
                  key={tontine.id}
                  className="w-[84vw] min-w-[17rem] sm:w-[22rem] md:w-[24rem] shrink-0 snap-start"
                >
                  <Link
                    href={`/tontines/${tontine.id}`}
                    className="group border-border bg-surface hover:border-accent flex h-full flex-col justify-between rounded-xl border p-5 transition-all hover:shadow-md"
                  >
                    <div>
                      {tontine.cover_url ? (
                        <div className="bg-bg-muted relative mb-4 aspect-video overflow-hidden rounded-lg">
                          <PublicStorageImage
                            src={tontine.cover_url}
                            alt={`Couverture de ${tontine.title}`}
                            fill
                            sizes="384px"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-display group-hover:text-accent-fg text-lg font-semibold line-clamp-1">
                          {tontine.title}
                        </h3>
                        {tontine.membership.status === "invited" ? (
                          <Badge variant="warning">Invitation</Badge>
                        ) : null}
                        {tontine.status !== "active" ? (
                          <Badge variant="neutral">
                            {tontine.status === "completed" ? "Terminée" : "Annulée"}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="text-fg-muted space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-fg">
                          <CircleDollarSign className="size-4 text-accent-fg" />
                          {Number(tontine.contribution_amount).toLocaleString("fr-FR")} F CFA / mois
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          {tontine.members.filter((m) => m.status === "active").length} membres actifs
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          Depuis le {new Date(`${tontine.starts_on}T12:00:00`).toLocaleDateString("fr-FR")}
                        </div>
                      </div>

                      {beneficiary ? (
                        <p className="mt-3 text-xs text-fg-muted bg-bg-subtle p-2 rounded">
                          Dernier bénéficiaire : <strong className="text-fg">{beneficiary}</strong>
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-fg-muted">
                        {!owner && tontine.membership.status === "invited" ? "Avis attendu" : "Voir détails"}
                      </span>
                      <span className="text-accent-fg inline-flex items-center gap-1 font-semibold">
                        Ouvrir{" "}
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

          {tontines.length > 1 ? (
            <div className="pointer-events-none absolute -inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between z-10">
              <button
                type="button"
                aria-label="Tontines précédentes"
                onClick={() => scroll(-1)}
                disabled={!canGoBack}
                className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-accent hover:text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Tontines suivantes"
                onClick={() => scroll(1)}
                disabled={!canGoForward}
                className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface/95 shadow-md text-fg transition-all hover:bg-accent hover:text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="divide-border border-border divide-y border-y">
          {tontines.map((tontine) => {
            const owner = tontine.membership.role === "owner";
            const beneficiary = tontine.latestCycle?.beneficiary_user_id
              ? tontine.members.find(
                  (member) => member.user_id === tontine.latestCycle?.beneficiary_user_id,
                )?.profile?.display_name
              : null;
            return (
              <li key={tontine.id}>
                <Link
                  href={`/tontines/${tontine.id}`}
                  className="group hover:bg-bg-muted/60 flex flex-col gap-4 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-3"
                >
                  {tontine.cover_url ? (
                    <div className="bg-bg-muted relative aspect-[16/7] overflow-hidden rounded-lg sm:aspect-video sm:w-48 sm:shrink-0">
                      <PublicStorageImage
                        src={tontine.cover_url}
                        alt={`Couverture de ${tontine.title}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 192px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="group-hover:text-primary truncate text-lg font-semibold">
                        {tontine.title}
                      </h2>
                      {tontine.membership.status === "invited" ? (
                        <Badge variant="warning">Invitation</Badge>
                      ) : null}
                      {tontine.status !== "active" ? (
                        <Badge variant="neutral">
                          {tontine.status === "completed" ? "Terminée" : "Annulée"}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-fg-muted mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <CircleDollarSign className="size-3.5" aria-hidden="true" />
                        {Number(tontine.contribution_amount).toLocaleString("fr-FR")} F CFA / mois
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" aria-hidden="true" />
                        {tontine.members.filter((member) => member.status === "active").length} membres
                        actifs
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        Depuis le{" "}
                        {new Date(`${tontine.starts_on}T12:00:00`).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    {beneficiary ? (
                      <p className="mt-2 text-sm">
                        Dernier bénéficiaire : <strong>{beneficiary}</strong>
                      </p>
                    ) : null}
                    {!owner && tontine.membership.status === "invited" ? (
                      <p className="text-primary mt-2 text-sm font-medium">Ton avis est attendu</p>
                    ) : null}
                  </div>
                  <span className="text-primary inline-flex shrink-0 items-center gap-2 text-sm font-semibold">
                    Ouvrir{" "}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
