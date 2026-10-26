import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { CURRENCY_LABEL, getCategoryLabel } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { PublishedEventView } from "@/types/database";

import styles from "./editorial.module.css";

/* =============================================================================
   Carte d'événement éditoriale
   --------------------------------------------------------------------------
   Même composition que l'accueil : affiche, bloc de date, titre serif, prix
   composté. La carte de l'application (event-card.tsx) reste intacte pour les
   espaces connecté et organisateur.
   ========================================================================== */

const DATE_FORMATTERS = {
  weekday: new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    timeZone: "Africa/Abidjan",
  }),
  day: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" }),
  month: new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    timeZone: "Africa/Abidjan",
  }),
} as const;

function dateParts(value: string) {
  const date = new Date(value);
  return {
    weekday: DATE_FORMATTERS.weekday.format(date).replace(".", ""),
    day: DATE_FORMATTERS.day.format(date),
    month: DATE_FORMATTERS.month.format(date).replace(".", ""),
  };
}

function priceLabel(event: Pick<PublishedEventView, "min_price" | "max_price">) {
  if (event.min_price <= 0 && event.max_price <= 0) return "Gratuit";
  if (event.min_price === event.max_price) {
    return `${formatNumber(event.min_price)} ${CURRENCY_LABEL}`;
  }
  return `dès ${formatNumber(event.min_price)} ${CURRENCY_LABEL}`;
}

function artVariant(category: string) {
  switch (category) {
    case "concerts":
    case "festivals":
    case "humour":
      return styles.artJazz;
    case "culture":
    case "mode":
    case "gastronomie":
      return styles.artMarche;
    case "formations":
    case "conferences":
    case "technologie":
    case "entreprises":
    case "etudiants":
      return styles.artAtelier;
    default:
      return styles.artRencontre;
  }
}

function posterTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return <em>{title}</em>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")} <em>{last}</em>
    </>
  );
}

export function EditorialEventCard({
  event,
  index = 0,
}: {
  event: PublishedEventView;
  index?: number;
}) {
  const gallery = Array.isArray(event.gallery) ? event.gallery : [];
  const imageUrl = event.cover_url ?? gallery[0] ?? null;
  const href = `/evenements/${event.slug}`;
  const date = dateParts(event.start_at);

  return (
    <article className={styles.card}>
      <Link
        href={href}
        className={styles.cardLink}
        aria-label={`${event.title}, ${date.day} ${date.month} à ${event.city}`}
      >
        <div className={`${styles.art} ${artVariant(event.category)}${imageUrl ? ` ${styles.artHasCover}` : ""}`}>
          {imageUrl ? (
            <PublicStorageImage
              src={imageUrl}
              alt=""
              fill
              sizes="(min-width: 1080px) 33vw, (min-width: 620px) 50vw, 100vw"
              quality={85}
              className={styles.cover}
            />
          ) : (
            <span className={styles.artFill} aria-hidden="true" />
          )}

          <div className={styles.artInner}>
            <div className={styles.artTop}>
              <span className={styles.artTag}>{getCategoryLabel(event.category)}</span>
              <span className={styles.artNum}>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className={styles.artWord}>
              {posterTitle(event.title)}
            </div>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardDate} aria-hidden="true">
            <span className={styles.dow}>{date.weekday}</span>
            <strong>{date.day}</strong>
            <span className={styles.month}>{date.month}</span>
          </div>

          <div className={styles.cardMain}>
            <h3>{event.title}</h3>
            <p>
              {event.venue_name ? `${event.venue_name} · ` : ""}
              {event.city}
            </p>
            <p>{event.organizer_name}</p>
          </div>

          <div className={styles.cardSide}>
            <p className={styles.cardPrice}>
              <span>Entrée</span>
              {priceLabel(event)}
            </p>
            <span className={styles.cardGo} aria-hidden="true">
              <ArrowUpRight />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function EditorialEventGrid({ events }: { events: PublishedEventView[] }) {
  return (
    <div className={styles.grid}>
      {events.map((event, index) => (
        <EditorialEventCard key={event.id} event={event} index={index} />
      ))}
    </div>
  );
}
