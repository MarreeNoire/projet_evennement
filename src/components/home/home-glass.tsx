"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { EditorialEventGrid } from "@/components/editorial/event-card";
import { HeroCover, type HeroCoverEvent } from "@/components/home/hero-cover";
import { getCategoryLabel, ROUTES } from "@/lib/constants";
import type { PublishedEventView } from "@/types/database";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

import styles from "./home-glass.module.css";

/* =============================================================================
   Accueil
   ---------------------------------------------------------------------------
   La page ne redéfinit plus ni carte, ni bouton, ni titre : elle compose les
   primitives du shell éditorial et la carte d'événement partagée
   (`EditorialEventGrid`), celles qu'utilisent /explorer et les fiches événement.
   Seul le hero garde une composition propre — l'affiche cadrée — avec la
   typographie éditoriale.
   ========================================================================== */

type HomeGlassProps = {
  events: PublishedEventView[];
  total: number;
};

function toHeroEvent(event: PublishedEventView): HeroCoverEvent {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    coverUrl: event.cover_url,
    categoryLabel: getCategoryLabel(event.category),
    city: event.city,
    venueName: event.venue_name,
    startAt: event.start_at,
    minPrice: event.min_price,
    maxPrice: event.max_price,
    firstTicketType: event.firstTicketType ?? null,
  };
}

export function HomeGlass({ events, total }: HomeGlassProps) {
  const heroEvents = events.map(toHeroEvent);

  return (
    <div className={shell.wrap}>
      <HeroCover events={heroEvents} />

      <section className={styles.section} id="a-la-une" aria-labelledby="featured-title">
        <div className={shell["section-head"]}>
          <h2 id="featured-title" className={shell["section-title"]}>
            À l&apos;affiche <em>cette semaine.</em>
          </h2>
          <Link href={ROUTES.explore} className={shell["link-arrow"]}>
            Tout l&apos;agenda
            <ArrowRight className={shell.icon} aria-hidden="true" />
          </Link>
        </div>

        {events.length ? (
          <EditorialEventGrid events={events} />
        ) : (
          <div className={shell.empty}>
            <Sparkles aria-hidden="true" className={shell.icon} />
            <h2>Le programme se prépare</h2>
            <p>Les événements publiés apparaîtront ici dès leur mise en ligne.</p>
            <Link
              href={ROUTES.explore}
              className={`${shell.btn} ${shell["btn-outline"]} ${shell["btn-sm"]}`}
            >
              Explorer l&apos;agenda
            </Link>
          </div>
        )}
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <div className={styles["closing-copy"]}>
          <p className={shell.eyebrow}>Prêt à vivre l&apos;expérience ?</p>
          <h2 id="closing-title" className={shell["section-title"]}>
            Réservez <em>maintenant.</em>
          </h2>
          <p className={shell["page-lead"]}>
            {total > 0
              ? `${total} événement${total > 1 ? "s" : ""} publié${total > 1 ? "s" : ""} par leurs organisateurs, à Abidjan et partout en Côte d’Ivoire.`
              : "Ne manquez plus les événements qui font vibrer votre ville."}
          </p>
        </div>

        <Link href={ROUTES.explore} className={`${shell.btn} ${shell["btn-primary"]}`}>
          Acheter mes billets
          <ArrowRight className={shell.icon} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
