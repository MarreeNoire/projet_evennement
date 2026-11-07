"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pause,
  Play,
} from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { ROUTES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

import styles from "./hero-cover.module.css";

/* =============================================================================
   Hero « affiche cadrée »
   ---------------------------------------------------------------------------
   Le titre, le surtitre et le chapô utilisent les primitives éditoriales du
   site (`page-head`, `page-title`, `page-lead`) : l'accueil parle la même langue
   que l'agenda et les fiches événement.

   L'affiche n'est plus un fond sous un voile : elle est présentée comme une
   affiche, dans un cadre portrait, image entière (aucun recadrage) et sans
   filtre. Le fil des prochaines sorties reprend la colonne de date des cartes
   éditoriales.

   Rotation maîtrisée : pause au survol et à la prise de focus, pause explicite,
   navigation manuelle, et aucune rotation automatique sous
   `prefers-reduced-motion`.
   ========================================================================== */

export type HeroCoverEvent = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  categoryLabel: string;
  city: string;
  venueName: string | null;
  startAt: string;
  minPrice: number;
  maxPrice: number;
  firstTicketType?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sold_count: number;
    access_level: string;
  } | null;
};

const WEEKDAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  timeZone: "Africa/Abidjan",
});
const DAY = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" });
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Abidjan" });

const MAX_SLIDES = 5;
const ROTATION_MS = 7000;
/* L'affiche sortante survit au fondu (700 ms) avec une marge : aucun intervalle
   où le cadre pourrait apparaître vide. */
const TRANSITION_MS = 1100;

function priceLabel(event: Pick<HeroCoverEvent, "minPrice" | "maxPrice">) {
  if (event.minPrice <= 0 && event.maxPrice <= 0) return "Gratuit";
  if (event.minPrice <= 0) return "Gratuit / payant";
  return `Dès ${formatNumber(event.minPrice)} FCFA`;
}

function weekday(value: string) {
  return WEEKDAY.format(new Date(value)).replace(/\./g, "");
}

function shortDate(value: string) {
  const date = new Date(value);
  return `${DAY.format(date)} ${MONTH.format(date).replace(/\./g, "")}`;
}

export function HeroCover({ events }: { events: HeroCoverEvent[] }) {
  /* Les affiches suivent l'ordre de l'agenda : la prochaine date d'abord. */
  const slides = useMemo(
    () => events.filter((event) => event.coverUrl).slice(0, MAX_SLIDES),
    [events],
  );

  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const cleanupRef = useRef<number | null>(null);

  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;
  const featured = slides[safeIndex] ?? events[0] ?? null;
  /* Fil stable, indépendant de l'affiche affichée. */
  const upcoming = events.slice(0, 3);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  /* Onglet masqué : la rotation s'arrête, aucun changement d'affiche ne peut
     se retrouver figé au retour. */
  useEffect(() => {
    const update = () => setTabHidden(document.visibilityState === "hidden");

    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (count < 2) return;

      setOutgoing(safeIndex);
      setIndex(((next % count) + count) % count);

      if (cleanupRef.current !== null) window.clearTimeout(cleanupRef.current);
      cleanupRef.current = window.setTimeout(() => setOutgoing(null), TRANSITION_MS);
    },
    [count, safeIndex],
  );

  useEffect(
    () => () => {
      if (cleanupRef.current !== null) window.clearTimeout(cleanupRef.current);
    },
    [],
  );

  useEffect(() => {
    if (count < 2 || paused || hovered || reduceMotion || tabHidden) return;

    const id = window.setInterval(() => goTo(safeIndex + 1), ROTATION_MS);
    return () => window.clearInterval(id);
  }, [count, paused, hovered, reduceMotion, tabHidden, safeIndex, goTo]);

  const nextSlide = count > 1 ? slides[(safeIndex + 1) % count] : null;

  return (
    <section
      className={styles.hero}
      aria-labelledby="hero-title"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <header className={`${shell["page-head"]} ${shell["page-head--split"]}`}>
        <div className={styles["head-main"]}>
          <p className={shell.eyebrow}>Billetterie et communauté</p>
          <h1 id="hero-title" className={shell["page-title"]}>
            Vos prochaines sorties, <em>en un tour.</em>
          </h1>
        </div>

        <div className={styles["head-aside"]}>
          <p className={shell["page-lead"]}>
            Réservez votre place, retrouvez votre communauté, et laissez la ville vous surprendre.
          </p>
          <div className={styles.actions}>
            <Link
              href={
                featured?.firstTicketType
                  ? `/evenements/${featured.slug}/billets?type=${featured.firstTicketType.id}`
                  : featured
                    ? `/evenements/${featured.slug}/billets`
                    : ROUTES.explore
              }
              className={`${shell.btn} ${shell["btn-primary"]}`}
            >
              {featured ? "Voir les billets" : "Explorer l'agenda"}
              <ArrowRight className={shell.icon} aria-hidden="true" />
            </Link>
            {featured ? (
              <Link href={ROUTES.explore} className={`${shell.btn} ${shell["btn-outline"]}`}>
                Explorer l&apos;agenda
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className={styles.showcase}>
        <figure className={styles["poster-card"]}>
          <div className={styles.poster}>
            <div className={styles.stack} aria-hidden="true">
              {count === 0 ? <div className={styles["backdrop-fallback"]} /> : null}

              {slides.map((slide, slideIndex) => {
                const isActive = slideIndex === safeIndex;
                const isOutgoing = slideIndex === outgoing;
                if (!isActive && !isOutgoing) return null;

                return (
                  <div
                    key={slide.id}
                    className={`${styles.slide} ${isActive ? styles["slide-active"] : ""} ${
                      isOutgoing ? styles["slide-outgoing"] : ""
                    }`.trim()}
                  >
                    <PublicStorageImage
                      src={slide.coverUrl!}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 88vw, 340px"
                      quality={85}
                      preload={slideIndex === 0}
                      className={styles["poster-image"]}
                    />
                  </div>
                );
              })}

              {/* L'affiche suivante est chargée à l'avance, invisible. */}
              {nextSlide ? (
                <div key={`next-${nextSlide.id}`} className={styles.slide}>
                  <PublicStorageImage
                    src={nextSlide.coverUrl!}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 88vw, 340px"
                    quality={85}
                    loading="eager"
                    className={styles["poster-image"]}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {featured ? (
            <figcaption className={styles.caption}>
              <span className={styles["caption-tag"]}>À l&apos;affiche</span>
              <Link href={`/evenements/${featured.slug}`} className={styles["caption-link"]}>
                {featured.title}
              </Link>
              <span className={styles["caption-meta"]}>
                <CalendarDays aria-hidden="true" />
                {shortDate(featured.startAt)}
              </span>
              <span className={styles["caption-meta"]}>
                <MapPin aria-hidden="true" />
                {featured.venueName ?? featured.city}
              </span>
            </figcaption>
          ) : null}

          {count > 1 ? (
            <div className={styles.rotation} role="group" aria-label="Affiches à la une">
              <button
                type="button"
                className={styles["rotation-button"]}
                aria-label="Affiche précédente"
                onClick={() => goTo(safeIndex - 1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles["rotation-button"]}
                aria-label={
                  paused ? "Reprendre le défilement des affiches" : "Mettre en pause les affiches"
                }
                aria-pressed={paused}
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              </button>
              <span className={styles["rotation-count"]} aria-live="off">
                {String(safeIndex + 1).padStart(2, "0")}
                <span aria-hidden="true"> / </span>
                {String(count).padStart(2, "0")}
              </span>
              <button
                type="button"
                className={styles["rotation-button"]}
                aria-label="Affiche suivante"
                onClick={() => goTo(safeIndex + 1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </figure>

        {upcoming.length ? (
          <div className={styles["upcoming-wrap"]}>
            <p className={shell["mono-label"]}>Prochaines sorties</p>
            <ol className={styles.upcoming} aria-label="Prochaines sorties">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <Link href={`/evenements/${event.slug}`} className={styles["upcoming-link"]}>
                    <span className={styles["upcoming-date"]} aria-hidden="true">
                      <span>{weekday(event.startAt)}</span>
                      <strong>{DAY.format(new Date(event.startAt))}</strong>
                      <span>{MONTH.format(new Date(event.startAt)).replace(/\./g, "")}</span>
                    </span>
                    <span className={styles["upcoming-body"]}>
                      <span className={styles["upcoming-title"]}>{event.title}</span>
                      <span className={styles["upcoming-meta"]}>
                        {event.categoryLabel} · {event.venueName ?? event.city} ·{" "}
                        {priceLabel(event)}
                      </span>
                    </span>
                    <ArrowUpRight className={styles["upcoming-arrow"]} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
