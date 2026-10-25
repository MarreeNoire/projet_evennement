import { CalendarDays, MapPin } from "lucide-react";

import { EventCountdown } from "@/components/events/event-countdown";
import { Avatar } from "@/components/ui/avatar";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { getCategoryLabel } from "@/lib/constants";
import { formatDateRange } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

import styles from "@/components/editorial/editorial.module.css";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

import { priceLabel } from "./event-card";

/* =============================================================================
   Couverture + titre d'un événement (version éditoriale)
   --------------------------------------------------------------------------
   Affiche plein cadre, catégorie et prix en surtitre, titre serif. Les
   informations pratiques sont alignées sur une ligne de filets.
   ========================================================================== */

export function EventHero({ event }: { event: PublishedEventView }) {
  const gallery = Array.isArray(event.gallery) ? event.gallery : [];
  const images = [
    ...new Set([event.cover_url, ...gallery].filter((url): url is string => Boolean(url))),
  ].map((src, index) => ({
    id: `${event.id}-image-${index}`,
    src,
    alt: `${event.title}, photo ${index + 1}`,
  }));

  return (
    <section aria-labelledby="titre-evenement">
      <div className={styles.eventCover}>
        {images.length > 0 ? (
          <ImageCarousel
            images={images}
            label={`Photos de ${event.title}`}
            slideClassName="h-full w-full basis-full"
            sizes="100vw"
            quality={72}
            preloadFirstImage
            className="size-full"
          />
        ) : (
          <div className={styles.eventCoverEmpty}>Aucune image</div>
        )}
      </div>

      <div className={styles.eventHead}>
        <p className={shell.eyebrow}>
          {getCategoryLabel(event.category)} · {priceLabel(event)}
        </p>
        <h1 id="titre-evenement" className={styles.eventTitle}>
          {event.title}
        </h1>
        {event.summary ? <p className={styles.eventSummary}>{event.summary}</p> : null}
      </div>
    </section>
  );
}

export function EventPracticalInfo({ event }: { event: PublishedEventView }) {
  return (
    <dl className={styles.infoGrid}>
      <div className={styles.infoItem}>
        <dt className={styles.infoLabel}>Date</dt>
        <dd className={styles.infoValue}>
          <CalendarDays aria-hidden="true" />
          <span>{formatDateRange(event.start_at, event.end_at)}</span>
          <EventCountdown startAt={event.start_at} />
        </dd>
      </div>
      <div className={styles.infoItem}>
        <dt className={styles.infoLabel}>Lieu</dt>
        <dd className={styles.infoValue}>
          <MapPin aria-hidden="true" />
          <span>
            {event.venue_name ? `${event.venue_name} · ` : ""}
            {event.city}, {event.country}
          </span>
        </dd>
      </div>
      <div className={styles.infoItem}>
        <dt className={styles.infoLabel}>Organisé par</dt>
        <dd className={styles.infoValue}>
          <Avatar src={event.organizer_logo_url} name={event.organizer_name} size="sm" />
          <span>
            {event.organizer_name}
            {event.organizer_verified ? (
              <span
                style={{
                  marginLeft: 8,
                  color: "var(--accent)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
                title="Organisateur vérifié"
              >
                vérifié
              </span>
            ) : null}
          </span>
        </dd>
      </div>
    </dl>
  );
}
