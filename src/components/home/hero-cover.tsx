"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pause,
  Play,
} from "lucide-react";

import { LetterSwap } from "@/components/ui/letter-swap";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { ROUTES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

import styles from "./hero-cover.module.css";

/* =============================================================================
   Hero « plein cadre »
   ---------------------------------------------------------------------------
   Adaptation du bloc Hero 16 : une affiche occupe tout le cadre, un très grand
   titre, un CTA scindé et la prochaine date.

   Le fond tourne sur les prochaines affiches publiées. Chaque passage révèle la
   nouvelle photo par une dissolution en demi-teintes : un maillage de points qui
   grossit depuis le centre de l'écran jusqu'à résoudre l'image — un écho au
   grain déjà présent sur l'accueil, plutôt qu'un simple fondu.

   Rotation maîtrisée : pause au survol et à la prise de focus, pause explicite,
   navigation manuelle, et aucune rotation automatique sous
   `prefers-reduced-motion` (le changement reste alors instantané).
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
};

const DAY = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" });
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Abidjan" });
const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Africa/Abidjan",
});

const MAX_SLIDES = 5;
const ROTATION_MS = 7000;
/* L'affiche sortante survit à la révélation (980 ms) avec une marge : aucun
   intervalle où le fond pourrait apparaître sans image. */
const TRANSITION_MS = 1400;

function priceLabel(event: Pick<HeroCoverEvent, "minPrice" | "maxPrice">) {
  if (event.minPrice <= 0 && event.maxPrice <= 0) return "Gratuit";
  if (event.minPrice <= 0) return "Gratuit / payant";
  return `Dès ${formatNumber(event.minPrice)} FCFA`;
}

function shortDate(value: string) {
  return SHORT_DATE.format(new Date(value)).replace(/\./g, "");
}

export function HeroCover({ events }: { events: HeroCoverEvent[] }) {
  /* Les affiches du fond suivent l'ordre de l'agenda : la prochaine date
     d'abord. Les sorties sans couverture restent dans la bande du bas. */
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
  /* Bande du bas : stable, indépendante de l'affiche affichée en fond. */
  const upcoming = events.slice(1, 4);

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
      <div className={styles.stack} aria-hidden="true">
        {count === 0 ? <div className={styles.backdropFallback} /> : null}

        {slides.map((slide, slideIndex) => {
          const isActive = slideIndex === safeIndex;
          const isOutgoing = slideIndex === outgoing;
          if (!isActive && !isOutgoing) return null;

          return (
            <div
              key={slide.id}
              className={`${styles.slide} ${isActive ? styles.slideActive : ""} ${
                isOutgoing ? styles.slideOutgoing : ""
              }`.trim()}
            >
              <PublicStorageImage
                src={slide.coverUrl!}
                alt=""
                fill
                sizes="100vw"
                quality={85}
                preload={slideIndex === 0}
                className={styles.backdropImage}
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
              sizes="100vw"
              quality={85}
              loading="eager"
              className={styles.backdropImage}
            />
          </div>
        ) : null}
      </div>

      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      {count > 1 ? (
        <div className={styles.rotation} role="group" aria-label="Affiche en arrière-plan">
          <button
            type="button"
            className={styles.rotationButton}
            aria-label="Affiche précédente"
            onClick={() => goTo(safeIndex - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.rotationButton}
            aria-label={paused ? "Reprendre le défilement des affiches" : "Mettre en pause les affiches"}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </button>
          <span className={styles.rotationCount} aria-live="off">
            {String(safeIndex + 1).padStart(2, "0")}
            <span aria-hidden="true"> / </span>
            {String(count).padStart(2, "0")}
          </span>
          <button
            type="button"
            className={styles.rotationButton}
            aria-label="Affiche suivante"
            onClick={() => goTo(safeIndex + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Billetterie et communauté
          </p>

          <h1 id="hero-title" className={styles.headline}>
            <LetterSwap
              segments={[
                { text: "Vos prochaines sorties, " },
                {
                  text: "en un tour.",
                  frontFaceClassName: styles.titleAccentFront,
                  backFaceClassName: styles.titleAccentBack,
                },
              ]}
              className={styles.title}
              frontFaceClassName={styles.titleFront}
              backFaceClassName={styles.titleBack}
              staggerInterval={0.026}
              staggerOrigin="first"
              flipDirection="top"
              duration={0.62}
            />
          </h1>

          <p className={styles.lead}>
            Réservez votre place, retrouvez votre communauté, et laissez la ville vous surprendre.
          </p>

          {featured ? (
            <div key={featured.id} className={styles.featured}>
              <span className={styles.featuredTag}>À l&apos;affiche</span>
              <Link href={`/evenements/${featured.slug}`} className={styles.featuredLink}>
                {featured.title}
              </Link>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span className={styles.featuredMeta}>
                <CalendarDays aria-hidden="true" />
                {shortDate(featured.startAt)}
              </span>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <span className={styles.featuredMeta}>
                <MapPin aria-hidden="true" />
                {featured.venueName ?? featured.city}
              </span>
            </div>
          ) : null}

          <div className={styles.actions}>
            <Link
              href={featured ? `/evenements/${featured.slug}/billets` : ROUTES.explore}
              className={styles.cta}
            >
              {featured ? "Voir les billets" : "Explorer l'agenda"}
              <ArrowRight aria-hidden="true" />
            </Link>
            {featured ? (
              <Link href={ROUTES.explore} className={styles.ctaSecondary}>
                Explorer l&apos;agenda
              </Link>
            ) : null}
          </div>
        </div>

        {upcoming.length ? (
          <ol className={styles.upcoming} aria-label="Prochaines sorties">
            {upcoming.map((event) => (
              <li key={event.id}>
                <Link href={`/evenements/${event.slug}`} className={styles.upcomingLink}>
                  <span className={styles.upcomingDate} aria-hidden="true">
                    <strong>{DAY.format(new Date(event.startAt))}</strong>
                    <span>{MONTH.format(new Date(event.startAt)).replace(".", "")}</span>
                  </span>
                  <span className={styles.upcomingBody}>
                    <span className={styles.upcomingTitle}>{event.title}</span>
                    <span className={styles.upcomingMeta}>
                      {event.categoryLabel} · {event.city} · {priceLabel(event)}
                    </span>
                  </span>
                  <ArrowUpRight className={styles.upcomingArrow} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <a href="#a-la-une" className={styles.scrollHint}>
        <ChevronDown aria-hidden="true" />
        <span>Défiler</span>
      </a>
    </section>
  );
}
