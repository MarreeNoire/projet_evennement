"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, MapPin, Pause, Play } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { ROUTES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

import styles from "./features-marquee.module.css";

/* =============================================================================
   Fil des sorties
   ---------------------------------------------------------------------------
   Adaptation du bloc « Features 3 » de React Bits (grille à marquees verticales
   de sens opposé) aux cartes d'événement du produit : trois colonnes qui
   défilent en alternance, fondues en haut et en bas, sur le fond braise.

   Le mouvement est entièrement porté par le CSS ; seule la pause explicite
   demande un état. Elle n'apparaît que si le bloc peut réellement défiler.
   ========================================================================== */

export type MarqueeEvent = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  categoryLabel: string;
  venueName: string | null;
  city: string;
  startAt: string;
  minPrice: number;
  maxPrice: number;
};

const DAY = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" });
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Abidjan" });

/* Des vitesses distinctes par colonne : le défilement alterné reste lisible
   comme une seule respiration, sans effet mécanique. */
const COLUMN_SPEEDS = ["52s", "63s", "57s"] as const;
const MIN_EVENTS_FOR_MARQUEE = 4;

/* Les paliers suivent les media queries de la feuille de styles : le nombre de
   colonnes est recalculé pour que chaque événement reste affiché, quelle que
   soit la largeur. */
const COLUMN_QUERIES = ["(max-width: 560px)", "(max-width: 880px)"] as const;

function priceLabel(event: Pick<MarqueeEvent, "minPrice" | "maxPrice">) {
  if (event.minPrice <= 0 && event.maxPrice <= 0) return "Gratuit";
  if (event.minPrice <= 0) return "Gratuit / payant";
  return `Dès ${formatNumber(event.minPrice)} FCFA`;
}

function splitIntoColumns(events: MarqueeEvent[], count: number) {
  const columns: MarqueeEvent[][] = Array.from({ length: count }, () => []);
  for (const [index, event] of events.entries()) {
    columns[index % count]?.push(event);
  }
  return columns;
}

function EventMarqueeCard({ event, clone = false }: { event: MarqueeEvent; clone?: boolean }) {
  const date = new Date(event.startAt);
  const place = [event.venueName, event.city].filter(Boolean).join(" · ");

  return (
    <article className={styles.card}>
      <Link href={`/evenements/${event.slug}`} className={styles.cardLink} tabIndex={clone ? -1 : undefined}>
        <div className={styles.poster}>
          {event.coverUrl ? (
            <PublicStorageImage
              src={event.coverUrl}
              alt=""
              fill
              sizes="(min-width: 880px) 30vw, 90vw"
              className={styles.cover}
            />
          ) : (
            <span className={styles.fallback} aria-hidden="true">
              {event.categoryLabel}
            </span>
          )}

          <time className={styles.date} dateTime={event.startAt}>
            <strong>{DAY.format(date)}</strong>
            <small>{MONTH.format(date).replace(".", "")}</small>
          </time>

          <span className={styles.tag}>{event.categoryLabel}</span>
        </div>

        <div className={styles.body}>
          <h3 className={styles.cardTitle}>{event.title}</h3>

          <p className={styles.meta}>
            <MapPin aria-hidden="true" />
            <span>{place}</span>
          </p>

          <div className={styles.foot}>
            <strong className={styles.price}>{priceLabel(event)}</strong>
            <span className={styles.go} aria-hidden="true">
              <ArrowUpRight />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function FeaturesMarquee({ events }: { events: MarqueeEvent[] }) {
  const [paused, setPaused] = useState(false);
  const [columnCount, setColumnCount] = useState<number>(COLUMN_SPEEDS.length);

  useEffect(() => {
    const queries = COLUMN_QUERIES.map((query) => window.matchMedia(query));
    const update = () => {
      const [narrow, medium] = queries;
      setColumnCount(narrow?.matches ? 1 : medium?.matches ? 2 : COLUMN_SPEEDS.length);
    };

    update();
    for (const query of queries) query.addEventListener("change", update);
    return () => {
      for (const query of queries) query.removeEventListener("change", update);
    };
  }, []);

  const scrolls = events.length >= MIN_EVENTS_FOR_MARQUEE;
  const columns = scrolls ? splitIntoColumns(events, columnCount) : [];

  return (
    <section id="fil-des-sorties" className={styles.section} aria-labelledby="fil-des-sorties-title">
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Le fil des sorties</p>
          <h2 id="fil-des-sorties-title" className={styles.title}>
            Les sorties ne s&apos;arrêtent <em>jamais.</em>
          </h2>
          <p className={styles.intro}>
            Un flux continu des prochaines dates : concerts, ateliers, rencontres. Le programme
            défile, les places restent.
          </p>
        </div>

        <div className={styles.headActions}>
          {scrolls ? (
            <button
              type="button"
              className={styles.control}
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              {paused ? "Reprendre le défilement" : "Mettre en pause"}
            </button>
          ) : null}

          <Link href={ROUTES.explore} className={styles.allLink}>
            Tout voir <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div
        className={styles.grid}
        data-paused={paused ? "true" : "false"}
        aria-label={scrolls ? "Sélection d'événements à venir, en défilement continu" : undefined}
        role={scrolls ? "region" : undefined}
      >
        {scrolls
          ? columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className={`${styles.column} ${columnIndex % 2 === 1 ? styles.reverse : ""}`.trim()}
                data-column={columnIndex}
              >
                <ul
                  className={styles.track}
                  style={{ "--marquee-duration": COLUMN_SPEEDS[columnIndex] } as CSSProperties}
                >
                  {/* Deuxième copie : relais visuel de la boucle, masquée aux
                      technologies d'assistance et retirée du focus clavier. */}
                  {[...column, ...column].map((event, index) => {
                    const isClone = index >= column.length;
                    return (
                      <li
                        key={`${event.id}-${index}`}
                        data-clone={isClone ? "true" : undefined}
                        aria-hidden={isClone ? true : undefined}
                      >
                        <EventMarqueeCard event={event} clone={isClone} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          : events.map((event) => <EventMarqueeCard key={event.id} event={event} />)}
      </div>
    </section>
  );
}
