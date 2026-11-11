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
import { ImageCarousel } from "@/components/ui/image-carousel";
import { EventCountdown } from "@/components/events/event-countdown";
import { Avatar } from "@/components/ui/avatar";
import { ROUTES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/constants";
import { priceLabel as eventPriceLabel } from "@/components/events/event-card";

import styles from "./unified-event-hero.module.css";

const DAY = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" });
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Abidjan" });
const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Africa/Abidjan",
});
const LONG_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Africa/Abidjan",
});

const MAX_SLIDES = 5;
const ROTATION_MS = 7000;
const TRANSITION_MS = 1400;

function shortDate(value: string) {
  return SHORT_DATE.format(new Date(value)).replace(/\./g, "");
}

interface BaseEvent {
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
  summary?: string | null;
  endAt?: string;
  gallery?: string[];
  organizerName?: string;
  organizerVerified?: boolean;
  organizerLogoUrl?: string | null;
}

type HeroMode = "featured" | "single";

interface UnifiedEventHeroProps {
  /** Mode d'affichage */
  mode: HeroMode;
  /** Événements (pour mode featured) ou événement unique (mode single) */
  events?: BaseEvent[];
  event?: BaseEvent;
  /** Pour mode featured : événements à venir affichés en bas */
  upcomingCount?: number;
  /** Callback lors du clic sur réserver */
  onReserve?: (eventId: string, ticketTypeId?: string) => void;
}

function priceLabel(event: Pick<BaseEvent, "minPrice" | "maxPrice">) {
  if (event.minPrice <= 0 && event.maxPrice <= 0) return "Gratuit";
  if (event.minPrice <= 0) return "Gratuit / payant";
  return `Dès ${formatNumber(event.minPrice)} FCFA`;
}

export function UnifiedEventHero({
  mode = "featured",
  events = [],
  event,
  upcomingCount = 3,
  onReserve,
}: UnifiedEventHeroProps) {
  /* ==================== MODE FEATURED (homepage carousel) ==================== */
  if (mode === "featured") {
    const slides = useMemo(
      () => events.filter((e) => e.coverUrl).slice(0, 5),
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
    const upcoming = events.slice(1, 4);

    useEffect(() => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const update = () => setReduceMotion(query.matches);
      update();
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }, []);

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
        cleanupRef.current = window.setTimeout(() => setOutgoing(null), 1400);
      },
      [count, safeIndex],
    );

    useEffect(() => {
      if (cleanupRef.current !== null) window.clearTimeout(cleanupRef.current);
    }, []);

    useEffect(() => {
      if (count < 2 || paused || hovered || reduceMotion || tabHidden) return;
      const id = window.setInterval(() => goTo(safeIndex + 1), 7000);
      return () => window.clearInterval(id);
    }, [count, paused, hovered, reduceMotion, tabHidden, safeIndex, goTo]);

    const nextSlide = count > 1 ? slides[(safeIndex + 1) % count] : null;

    const handleReserve = (evt: BaseEvent, ticketTypeId?: string) => {
      onReserve?.(evt.id, ticketTypeId);
    };

    return (
      <section
        className={styles.hero}
        aria-labelledby="hero-title"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={() => setHovered(false)}
      >
        <div className={styles.inner}>
          <div className={styles.top}>
            <div className={styles.leadColumn}>
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
                  Réservez votre place, retrouvez votre communauté, et laissez la ville vous
                  surprendre.
                </p>
              </div>

              <div className={styles.actions}>
                <Link
                  href={featured?.firstTicketType
                    ? `/evenements/${featured.slug}/billets?type=${featured.firstTicketType.id}`
                    : featured
                      ? `/evenements/${featured.slug}/billets`
                      : "/explorer"}
                  className={styles.cta}
                >
                  {featured ? "Voir les billets" : "Explorer l'agenda"}
                  <ArrowRight aria-hidden="true" />
                </Link>
                {featured ? (
                  <Link href="/explorer" className={styles.ctaSecondary}>
                    Explorer l&apos;agenda
                  </Link>
                ) : null}
              </div>
            </div>

            <figure className={styles.posterCard}>
              <div className={styles.poster}>
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
                          sizes="(max-width: 760px) 92vw, 420px"
                          quality={85}
                          preload={slideIndex === 0}
                          className={styles.posterImage}
                        />
                      </div>
                    );
                  })}

                  {nextSlide ? (
                    <div key={`next-${nextSlide.id}`} className={styles.slide}>
                      <PublicStorageImage
                        src={nextSlide.coverUrl!}
                        alt=""
                        fill
                        sizes="(max-width: 760px) 92vw, 420px"
                        quality={85}
                        loading="eager"
                        className={styles.posterImage}
                      />
                    </div>
                  ) : null}
                </div>

                <div className={styles.grain} aria-hidden="true" />
              </div>

              {featured ? (
                <figcaption className={styles.caption}>
                  <span className={styles.captionTag}>À l&apos;affiche</span>
                  <Link href={`/evenements/${featured.slug}`} className={styles.captionLink}>
                    {featured.title}
                  </Link>
                  <span className={styles.captionMeta}>
                    <CalendarDays aria-hidden="true" />
                    {shortDate(featured.startAt)}
                  </span>
                  <span className={styles.captionMeta}>
                    <MapPin aria-hidden="true" />
                    {featured.venueName ?? featured.city}
                  </span>
                </figcaption>
              ) : null}

              {count > 1 ? (
                <div className={styles.rotation} role="group" aria-label="Affiches à la une">
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
                    aria-label={paused ? "Reprendre le défilement" : "Mettre en pause"}
                    aria-pressed={paused}
                    onClick={() => setPaused((v) => !v)}
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
            </figure>
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

          <a href="#a-la-une" className={styles.scrollHint}>
            <ChevronDown aria-hidden="true" />
            <span>Défiler</span>
          </a>
        </div>
      </section>
    );
  }

  /* ==================== MODE SINGLE (page événement) ==================== */
  if (mode === "single" && event) {
    const gallery = Array.isArray(event.gallery) ? event.gallery : [];
    const images = [
      ...new Set([event.coverUrl, ...gallery].filter((url): url is string => Boolean(url))),
    ].map((src, index) => ({
      id: `${event.id}-image-${index}`,
      src,
      alt: `${event.title}, photo ${index + 1}`,
    }));

    return (
      <section aria-labelledby="titre-evenement" className={styles.singleHero}>
        <div className={styles.eventCover}>
          {images.length > 0 ? (
            <ImageCarousel
              images={images}
              label={`Photos de ${event.title}`}
              slideClassName="h-full w-full basis-full"
              sizes="100vw"
              quality={90}
              preloadFirstImage
              className="size-full"
            />
          ) : (
            <div className={styles.eventCoverEmpty}>Aucune image</div>
          )}
        </div>

        <div className={styles.eventHead}>
          <p className={styles.eyebrow}>
            {event.categoryLabel} · {priceLabel(event)}
          </p>
          <h1 id="titre-evenement" className={styles.eventTitle}>
            {event.title}
          </h1>
          {event.summary ? <p className={styles.eventSummary}>{event.summary}</p> : null}
        </div>

      </section>
    );
  }

  return null;
}

export type { UnifiedEventHeroProps };
