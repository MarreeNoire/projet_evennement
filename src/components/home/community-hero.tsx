"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import type { PublishedEventView } from "@/types/database";
import { formatEventDate, formatEventPrice } from "./home-data";
import styles from "./community-hero.module.css";

/** Cadence de rotation de la sortie mise en avant. */
const ROTATION_MS = 2000;
/** Nombre de sorties qui défilent dans le hero (les prochaines). */
const MAX_ROTATING_EVENTS = 6;
const IMAGE_SIZES = "(min-width: 1200px) 49vw, (min-width: 760px) 56vw, 92vw";

interface SlideState {
  current: number;
  previous: number | null;
}

function EventMedia({
  event,
  preload = false,
}: {
  event: PublishedEventView;
  preload?: boolean;
}) {
  const cover = event.cover_url || event.gallery?.[0];

  if (!cover) {
    return (
      <div className={styles.featuredFallback} aria-hidden="true">
        <span>{event.category}</span>
      </div>
    );
  }

  return (
    <PublicStorageImage
      src={cover}
      alt=""
      fill
      sizes={IMAGE_SIZES}
      quality={80}
      preload={preload}
      className={styles.featuredImage}
    />
  );
}

export function CommunityHero({
  events,
  weekCount,
}: {
  events: PublishedEventView[];
  weekCount: number;
}) {
  const rotation = useMemo(() => events.slice(0, MAX_ROTATING_EVENTS), [events]);
  const [slide, setSlide] = useState<SlideState>({ current: 0, previous: null });
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const featured = rotation[slide.current] ?? events[0];
  const previous = slide.previous !== null ? rotation[slide.previous] : undefined;
  const hasRotated = slide.previous !== null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (rotation.length < 2 || paused || reduceMotion) return;

    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setSlide((state) => ({
        current: (state.current + 1) % rotation.length,
        previous: state.current,
      }));
    }, ROTATION_MS);

    return () => window.clearInterval(id);
  }, [paused, reduceMotion, rotation.length]);

  const note =
    weekCount > 0
      ? `${weekCount} sortie${weekCount > 1 ? "s" : ""} cette semaine`
      : events.length > 0
        ? "Les prochaines sorties sont à découvrir ci-dessous"
        : "Aucune sortie publiée pour le moment";

  return (
    <section className={styles.section} aria-labelledby="community-hero-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 id="community-hero-title">
            Les sorties qui animent <em>Abidjan & la Côte d’Ivoire</em>
          </h1>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/explorer?sort=date_asc">
              Voir les sorties du week-end <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link className={styles.secondary} href="/devenir-organisateur">
              Je suis organisateur
            </Link>
          </div>
          <p className={styles.note}>{note}</p>
        </div>

        <div
          className={styles.featured}
          data-paused={paused ? "true" : "false"}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {featured ? (
            <Link href={`/evenements/${featured.slug}`} className={styles.featuredCard}>
              <div className={styles.featuredMedia}>
                {previous ? (
                  <div key={previous.slug} className={styles.mediaLayer}>
                    <EventMedia event={previous} />
                  </div>
                ) : null}
                <div
                  key={featured.slug}
                  className={`${styles.mediaLayer}${hasRotated ? ` ${styles.mediaLayerIn}` : ""}`}
                >
                  <EventMedia
                    event={featured}
                    preload={!hasRotated && slide.current === 0}
                  />
                </div>
                <div className={styles.featuredScrim} />
              </div>
              <div
                key={featured.slug}
                className={`${styles.featuredContent}${hasRotated ? ` ${styles.contentIn}` : ""}`}
              >
                <div className={styles.featuredMeta}>
                  <span>
                    <CalendarDays aria-hidden="true" />
                    {formatEventDate(featured.start_at).fullBadge}
                  </span>
                  <span>
                    <MapPin aria-hidden="true" />
                    {featured.city}
                  </span>
                </div>
                <h2>{featured.title}</h2>
                <div className={styles.featuredFooter}>
                  <span className={styles.featuredPrice}>{formatEventPrice(featured)}</span>
                  <span className={styles.featuredVenue}>
                    {featured.venue_name || "Lieu à confirmer"}
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className={styles.featuredEmpty}>
              <p>Les événements publiés apparaîtront ici.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
