"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Ticket } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import type { PublishedEventView } from "@/types/database";
import { formatEventDate, formatEventPrice } from "./home-data";
import styles from "./hero-carousel-3d.module.css";

export function HeroCarousel3D({ events }: { events: PublishedEventView[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = events.length;

  const moveTo = (index: number) => {
    if (!total) return;
    setActiveIndex((index + total) % total);
  };

  useEffect(() => {
    if (total < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setActiveIndex((current) => (current + 1) % total);
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current - 1 + total) % total);
    };
    const region = document.querySelector<HTMLElement>("[data-hero-carousel]");
    region?.addEventListener("keydown", onKeyDown);
    return () => region?.removeEventListener("keydown", onKeyDown);
  }, [total]);

  if (total === 0) {
    return (
      <div className={styles.emptyStage}>
        <div className={styles.emptyArtwork} aria-hidden="true">
          <span>EVENT</span>
          <i />
          <b>À bientôt<br />sur la piste.</b>
        </div>
        <p>Les événements publiés apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className={styles.carousel} data-hero-carousel tabIndex={0} aria-label="Carrousel des événements à venir">
      <div className={styles.stage}>
        {events.map((event, index) => {
          let offset = index - activeIndex;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;
          if (Math.abs(offset) > 2) return null;

          const side = Math.sign(offset);
          const cardStyle = {
            "--x": `${offset * 53}%`,
            "--z": `${Math.abs(offset) * -110}px`,
            "--rot": `${side * -18}deg`,
            "--scale": Math.max(0.7, 1 - Math.abs(offset) * 0.15),
            "--opacity": Math.abs(offset) === 2 ? 0.45 : 1,
            "--brightness": offset === 0 ? 1 : 0.72,
            "--layer": 30 - Math.abs(offset) * 10,
          } as CSSProperties;
          const cover = event.cover_url ?? event.gallery?.[0] ?? null;
          const date = formatEventDate(event.start_at);
          const isActive = offset === 0;

          return (
            <Link
              className={`${styles.card} ${isActive ? styles.cardActive : styles.cardSide}`}
              data-position={offset}
              href={`/evenements/${event.slug}`}
              key={event.id}
              onClick={(click) => {
                if (!isActive) {
                  click.preventDefault();
                  moveTo(index);
                }
              }}
              aria-label={`${isActive ? "Ouvrir" : "Sélectionner"} ${event.title}`}
              aria-current={isActive ? "true" : undefined}
              style={cardStyle}
              tabIndex={isActive ? 0 : -1}
            >
              <div className={styles.cover}>
                {cover ? (
                  <PublicStorageImage
                    src={cover}
                    alt=""
                    fill
                    sizes="(min-width: 1000px) 34vw, (min-width: 700px) 45vw, 72vw"
                    quality={76}
                    className={styles.coverImage}
                    preload={isActive && activeIndex === 0}
                  />
                ) : (
                  <div className={styles.posterFallback}>
                    <span>{event.category}</span>
                    <strong>{event.title}</strong>
                    <i aria-hidden="true" />
                  </div>
                )}
                <div className={styles.scrim} />
                <div className={styles.cardTop}>
                  <span>{event.city}</span>
                  <time dateTime={event.start_at}>{date.dayMonth}</time>
                </div>
                <div className={styles.cardContent}>
                  <p className={styles.cardType}>{event.category}</p>
                  <h2>{event.title}</h2>
                  <div className={styles.meta}>
                    <span><CalendarDays aria-hidden="true" />{date.fullBadge}</span>
                    <span><MapPin aria-hidden="true" />{event.venue_name || event.city}</span>
                  </div>
                  <div className={styles.cardBottom}>
                    <span className={styles.price}>{formatEventPrice(event)}</span>
                    <span className={styles.ticketAction}>Voir la sortie <Ticket aria-hidden="true" /></span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {total > 1 ? (
          <div className={styles.controls}>
            <button type="button" onClick={() => setActiveIndex((current) => (current - 1 + total) % total)} aria-label="Événement précédent"><ArrowLeft aria-hidden="true" /></button>
            <span><b>{String(activeIndex + 1).padStart(2, "0")}</b><i />{String(total).padStart(2, "0")}</span>
            <button type="button" onClick={() => setActiveIndex((current) => (current + 1) % total)} aria-label="Événement suivant"><ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}
      </div>
      <div className={styles.caption} aria-live="polite">
        <span>La prochaine histoire commence ici.</span>
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
