"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Pause, Play } from "lucide-react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { HeroScreen } from "@/components/home/hero-screen";
import { ROUTES } from "@/lib/constants";
import shell from "@/components/layout/editorial/editorial-shell.module.css";

import styles from "./hero-cover.module.css";

/* =============================================================================
   Hero de l'accueil
   ---------------------------------------------------------------------------
   Le titre, le surtitre et le chapô utilisent les primitives éditoriales du
   site (`page-head`, `page-title`, `page-lead`) : l'accueil parle la même langue
   que l'agenda et les fiches événement.

   Le carrousel reprend la mécanique du hero de DG Cinema : une bande pleine
   largeur d'affiches portrait qui défile en continu, bord à bord. Chaque
   affiche est recadrée pour remplir sa vignette (aucune bande vide), et les
   données restent celles des prochaines sorties du site.

   Rotation maîtrisée : pause au survol et à la prise de focus, pause explicite,
   et aucune animation automatique sous `prefers-reduced-motion`.
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

const DAY = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" });
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Abidjan" });

const MAX_SLIDES = 6;
/* Temps de traversée d'une affiche dans la bande. */
const SLIDE_SECONDS = 6;

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

  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const count = slides.length;
  const featured = slides[0] ?? events[0] ?? null;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  /* Deux copies de la bande : la seconde prend le relais pendant que la
     première sort de l'écran, ce qui rend la boucle invisible. */
  const loop = count > 1 ? [...slides, ...slides] : slides;
  const marqueeDuration = count > 1 ? count * SLIDE_SECONDS : 0;
  const animationPaused = paused || hovered || tabHidden || count < 2;
  const screenPaused = paused || reduceMotion || tabHidden;

  /* Onglet masqué : le défilement s'arrête, aucun mouvement ne se retrouve
     figé au retour. */
  useEffect(() => {
    const update = () => setTabHidden(document.visibilityState === "hidden");

    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  function ticketHref(event: HeroCoverEvent) {
    return event.firstTicketType
      ? `/evenements/${event.slug}/billets?type=${event.firstTicketType.id}`
      : `/evenements/${event.slug}/billets`;
  }

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <header className={`${shell["page-head"]} ${shell["page-head--split"]}`}>
        <div className={styles["head-main"]}>
          <p className={shell.eyebrow}>Billetterie et communauté</p>
          <h1 id="hero-title" className={shell["page-title"]}>
            Fais-toi des amis <em>sur Event.</em>
          </h1>
        </div>

        <div className={styles["head-aside"]}>
          <p className={shell["page-lead"]}>
            Réservez votre place, retrouvez votre communauté, et laissez la ville vous surprendre.
          </p>
          <div className={styles.actions}>
            <Link
              href={featured ? ticketHref(featured) : ROUTES.explore}
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
        <figure
          className={styles["strip-figure"]}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setHovered(true)}
          onBlurCapture={() => setHovered(false)}
        >
          {/* Mur courbé three.js (repli : bande tactile sans WebGL). */}
          {count > 1 ? (
            <HeroScreen
              posters={slides.map((slide) => ({ id: slide.id, src: slide.coverUrl! }))}
              paused={screenPaused}
            />
          ) : (
            <div className={styles["strip-bleed"]}>
              <div className={styles.strip} data-paused={animationPaused ? "true" : undefined}>
                <div
                  className={styles.track}
                  style={{ "--marquee-duration": `${marqueeDuration}s` } as CSSProperties}
                >
                  {count === 0 ? <div className={styles["backdrop-fallback"]} /> : null}
                  {loop.map((slide, slideIndex) => {
                    const duplicate = slideIndex >= count;

                    return (
                      <Link
                        key={`${slide.id}-${slideIndex}`}
                        href={`/evenements/${slide.slug}`}
                        className={styles["strip-slide"]}
                        aria-hidden={duplicate ? "true" : undefined}
                        tabIndex={duplicate ? -1 : undefined}
                        aria-label={duplicate ? undefined : slide.title}
                      >
                        <PublicStorageImage
                          src={slide.coverUrl!}
                          alt=""
                          fill
                          sizes="(max-width: 767px) 45vw, 22vw"
                          quality={85}
                          preload={slideIndex === 0}
                          className={styles["strip-image"]}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
              <Link href={ROUTES.explore} className={styles["caption-explore"]}>
                Tout l&apos;agenda
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </figcaption>
          ) : null}

          {count > 1 ? (
            <div className={styles.rotation} role="group" aria-label="Affiches à la une">
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
              <span className={styles["rotation-hint"]}>
                {paused ? "Défilement en pause" : "Affiches des prochaines sorties"}
              </span>
            </div>
          ) : null}
        </figure>

      </div>
    </section>
  );
}
