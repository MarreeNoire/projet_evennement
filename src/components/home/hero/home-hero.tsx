"use client";

import Link from "next/link";
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
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { ROUTES } from "@/lib/constants";

import styles from "./home-hero.module.css";

export type HomeHeroEvent = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverUrl: string | null;
  venueName: string | null;
  city: string;
  startAt: string;
  minPrice: number;
};

type HomeHeroProps = {
  events: HomeHeroEvent[];
  eventCount: number | null;
  eventsUnavailable: boolean;
};

const DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Africa/Abidjan",
});

const TIME = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Abidjan",
});

const rise = {
  hidden: { opacity: 0, transform: "translateY(18px)" },
  show: {
    opacity: 1,
    transform: "translateY(0)",
    transition: { duration: 0.62, ease: [0.23, 1, 0.32, 1] as const },
  },
};

const intro = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function priceLabel(event: HomeHeroEvent) {
  if (event.minPrice <= 0) return "Entrée libre";
  return `Dès ${new Intl.NumberFormat("fr-FR").format(event.minPrice)} FCFA`;
}

export function HomeHero({ events, eventCount, eventsUnavailable }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);
  const isVisualInView = useInView(visualRef, { amount: 0.25 });
  const featured = events[activeIndex] ?? null;
  const featuredDate = featured ? safeDate(featured.startAt) : null;
  const formattedEventCount =
    eventCount === null ? "—" : new Intl.NumberFormat("fr-FR").format(eventCount);

  useEffect(() => {
    if (reduceMotion || rotationPaused || isHovered || !isVisualInView || events.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % events.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [events.length, isHovered, isVisualInView, reduceMotion, rotationPaused]);

  function showEvent(direction: number) {
    setRotationPaused(true);
    setActiveIndex((current) => (current + direction + events.length) % events.length);
  }

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.inner}>
        <motion.div
          className={styles.copy}
          variants={intro}
          initial={reduceMotion ? false : "hidden"}
          animate="show"
        >
          <motion.p className={styles.eyebrow} variants={rise}>
            La scène est à vous <span aria-hidden="true" />
          </motion.p>

          <motion.h1 id="hero-title" className={styles.headline} variants={rise}>
            <span>Toutes les</span>
            <em>sorties</em>
            <span>d&apos;Abidjan.</span>
          </motion.h1>

          <motion.p className={styles.sub} variants={rise}>
            Réserve ta place. Retrouve ta communauté. Et laisse la ville te surprendre.
          </motion.p>

          <motion.div className={styles.actions} variants={rise}>
            <Link href={ROUTES.explore} className={styles.cta}>
              Explorer les événements
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/devenir-organisateur" className={styles.secondary}>
              Organiser une sortie
            </Link>
          </motion.div>

          <motion.dl className={styles.proof} variants={rise}>
            <div className={styles.proofMark} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <dt>{formattedEventCount}</dt>
              <dd>{eventsUnavailable ? "agenda indisponible" : "sorties affichées"}</dd>
            </div>
          </motion.dl>
        </motion.div>

        <motion.div
          className={styles.visual}
          ref={visualRef}
          initial={reduceMotion ? false : { opacity: 0, transform: "translateY(18px) scale(0.98)" }}
          animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
          transition={{
            duration: 0.72,
            delay: 0.12,
            ease: [0.23, 1, 0.32, 1] as const,
          }}
          role="region"
          aria-label="Événements à la une"
          aria-roledescription="carrousel"
          onFocusCapture={() => setRotationPaused(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={featured?.id ?? "empty"}
              className={styles.slide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduceMotion ? 0.14 : 0.22,
                ease: [0.23, 1, 0.32, 1] as const,
              }}
              role="group"
              aria-roledescription="diapositive"
              aria-label={
                events.length > 0
                  ? `${activeIndex + 1} sur ${events.length}`
                  : "Aucune sortie à la une"
              }
              aria-live={rotationPaused ? "polite" : "off"}
            >
              <div className={styles.arch}>
                {featured?.coverUrl ? (
                  <PublicStorageImage
                    src={featured.coverUrl}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 84vw, (max-width: 1100px) 48vw, 42vw"
                    quality={84}
                    preload={activeIndex === 0}
                  />
                ) : (
                  <div className={styles.archFallback} aria-hidden="true" />
                )}
                <div className={styles.imageVeil} aria-hidden="true" />
                <p className={styles.imageLabel}>
                  <span>{featured?.city || "ABIDJAN"}</span>
                  <span>·</span>
                  <span>CÔTE D&apos;IVOIRE</span>
                </p>
              </div>

              <Link
                href={featured ? `/evenements/${featured.slug}` : ROUTES.explore}
                className={styles.featureCard}
                aria-label={
                  featured ? `Découvrir l'événement ${featured.title}` : "Explorer les événements"
                }
              >
                <span className={styles.featureKicker}>À l&apos;affiche</span>
                <span className={styles.featureTitle}>
                  {featured?.title ??
                    (eventsUnavailable ? "Sorties indisponibles" : "Les prochaines sorties")}
                </span>
                <span className={styles.featureMeta}>
                  {featured ? (
                    <>
                      <span>
                        <CalendarDays aria-hidden="true" />
                        {featuredDate
                          ? `${DATE.format(featuredDate)} · ${TIME.format(featuredDate)}`
                          : "Date à confirmer"}
                      </span>
                      <span>
                        <MapPin aria-hidden="true" />
                        {featured.venueName || featured.city}
                      </span>
                      <strong>{priceLabel(featured)}</strong>
                    </>
                  ) : (
                    <span>
                      {eventsUnavailable
                        ? "Les événements n'ont pas pu être chargés."
                        : "Les événements publiés apparaîtront ici."}
                    </span>
                  )}
                </span>
                <span className={styles.featureArrow} aria-hidden="true">
                  <ArrowUpRight />
                </span>
              </Link>
            </motion.div>
          </AnimatePresence>

          {events.length > 1 && (
            <div className={styles.carouselControls}>
              <button
                type="button"
                className={styles.carouselButton}
                aria-label="Événement précédent"
                onClick={() => showEvent(-1)}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              {!reduceMotion && (
                <button
                  type="button"
                  className={styles.carouselButton}
                  aria-label={
                    rotationPaused
                      ? "Reprendre le défilement automatique"
                      : "Mettre en pause le défilement automatique"
                  }
                  onClick={() => setRotationPaused((paused) => !paused)}
                >
                  {rotationPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                </button>
              )}
              <button
                type="button"
                className={styles.carouselButton}
                aria-label="Événement suivant"
                onClick={() => showEvent(1)}
              >
                <ChevronRight aria-hidden="true" />
              </button>
              <span className={styles.carouselCount} aria-hidden="true">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(events.length).padStart(2, "0")}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
