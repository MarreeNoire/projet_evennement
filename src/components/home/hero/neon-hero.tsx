"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { APP_NAME, ROUTES } from "@/lib/constants";

import styles from "./neon-hero.module.css";

/* =============================================================================
   Hero néon
   --------------------------------------------------------------------------
   Reprend la composition de la référence : fond vert profond, titre coupé en
   deux — blanc puis dégradé lime → menthe —, et une « fenêtre d'application »
   qui montre la vraie sélection du moment. Les données viennent de la base :
   l'événement à la une, les catégories réellement présentes et les compteurs
   de la plateforme.

   Aucune image décorative : la couverture de l'événement est la seule photo,
   ce qui garde le hero léger et toujours à jour.
   ========================================================================== */

export type NeonHeroEvent = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverUrl: string | null;
  category: string;
  categoryLabel: string;
  venueName: string | null;
  city: string;
  startAt: string;
  minPrice: number;
  maxPrice: number;
};

export type NeonHeroStats = {
  events: number;
  organizers: number;
  cities: number;
};

type NeonHeroProps = {
  events: NeonHeroEvent[];
  stats: NeonHeroStats;
  total: number;
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

/** Palette de référence exacte (DataWarlord mock) : 4 cartes emblématiques */
const PALETTE_SWATCHES = [
  {
    hex: "#A7F432",
    tag: "Billetterie",
    title: "Pass & Mobile Money",
    desc: "Wave · Orange · MTN · QR sécurisé",
    href: "#billets",
    bg: "#a7f432",
    fg: "#0f1f16",
    badgeBg: "rgba(15, 31, 22, 0.12)",
    badgeFg: "#0f1f16",
  },
  {
    hex: "#0F1F16",
    tag: "Sorties",
    title: "Nuits & Concerts",
    desc: "Festivals · Lives · Soirées Abidjan",
    href: "/explorer?categorie=concerts",
    bg: "#0f1f16",
    fg: "#eaf3e7",
    border: "1px solid rgba(167, 244, 50, 0.24)",
    badgeBg: "rgba(167, 244, 50, 0.14)",
    badgeFg: "#a7f432",
  },
  {
    hex: "#EAF3E7",
    tag: "Communauté",
    title: "Salons de discussion",
    desc: "Échangez avant & retrouvez-vous après",
    href: "#salons",
    bg: "#eaf3e7",
    fg: "#0f1f16",
    badgeBg: "rgba(15, 31, 22, 0.1)",
    badgeFg: "#0f1f16",
  },
  {
    hex: "#3B8F7B",
    tag: "Agenda",
    title: "Culture & Pro",
    desc: "Conférences · Expos · Salons tech",
    href: "/explorer?categorie=culture",
    bg: "#3b8f7b",
    fg: "#ffffff",
    badgeBg: "rgba(255, 255, 255, 0.16)",
    badgeFg: "#ffffff",
  },
] as const;

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function priceLabel(event: NeonHeroEvent | null) {
  if (!event) return "Programme";
  if (event.minPrice <= 0) return "Entrée libre";
  return `Dès ${new Intl.NumberFormat("fr-FR").format(event.minPrice)} FCFA`;
}

export function NeonHero({ events, stats, total }: NeonHeroProps) {
  const reduceMotion = useReducedMotion();
  const featured = events[0] ?? null;
  const featuredDate = featured ? safeDate(featured.startAt) : null;

  /* Une tuile par catégorie réellement présente : on regroupe les événements
     de la page au lieu de répéter la même catégorie, et on garde la première
     couverture disponible pour illustrer le rail. */
  const categories = useMemo(() => {
    const byCategory = new Map<
      string,
      { category: string; label: string; city: string; count: number; coverUrl: string | null }
    >();

    for (const event of events) {
      const current = byCategory.get(event.category);
      if (current) {
        current.count += 1;
        current.coverUrl ??= event.coverUrl;
        continue;
      }
      byCategory.set(event.category, {
        category: event.category,
        label: event.categoryLabel,
        city: event.city,
        count: 1,
        coverUrl: event.coverUrl,
      });
    }

    return [...byCategory.values()].sort((a, b) => b.count - a.count);
  }, [events]);

  /* Les 3 cartes du rail droit : inspirées des 3 cartes de la maquette de référence.
     On utilise de vrais événements publiés pour afficher un visuel garanti et le titre réel. */
  const railItems = useMemo(() => {
    if (events.length >= 4) {
      return events.slice(1, 4).map((evt) => ({
        id: evt.id,
        label: evt.title,
        tag: evt.categoryLabel,
        href: `/evenements/${evt.slug}`,
        coverUrl: evt.coverUrl ?? featured?.coverUrl ?? null,
      }));
    }
    return categories.slice(0, 3).map((cat) => ({
      id: cat.category,
      label: cat.label,
      tag: cat.city,
      href: `/explorer?categorie=${cat.category}`,
      coverUrl: cat.coverUrl ?? featured?.coverUrl ?? null,
    }));
  }, [events, categories, featured]);

  const headline = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const line = {
    hidden: { opacity: 0, y: 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.aura} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.inner}>
        <motion.div
          className={styles.headline}
          variants={headline}
          initial={reduceMotion ? false : "hidden"}
          animate="show"
        >
          <motion.h1 id="hero-title" variants={line}>
            <span className={styles.lineOne}>Toutes les sorties</span>
            <span className={styles.lineTwo}>d’Abidjan</span>
          </motion.h1>
          <motion.p className={styles.sub} variants={line}>
            Réserve ta place. Retrouve ta communauté.
          </motion.p>
        </motion.div>

        <motion.div
          className={styles.stage}
          initial={reduceMotion ? false : { opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.window}>
            <div className={styles.windowBar}>
              <span className={styles.windowBrand}>
                {APP_NAME.toLowerCase()}
                <i aria-hidden="true">•</i>
              </span>
              <nav className={styles.windowNav} aria-hidden="true">
                <span>Accueil</span>
                <span>Explorer</span>
                <span>Salons</span>
                <span>Billets</span>
              </nav>
              <span className={styles.windowIcons} aria-hidden="true">
                <Ticket />
                <span className={styles.windowCart}>
                  <Users />
                </span>
              </span>
            </div>

            <div className={styles.windowBody}>
              <div className={styles.copy}>
                <p className={styles.eyebrow}>
                  <span aria-hidden="true" />
                  Sélection du moment
                </p>

                <h2 className={styles.eventTitle}>
                  {featured ? featured.title : "Les prochaines sorties"}
                </h2>

                <p className={styles.lede}>
                  {featured?.summary ||
                    (featured
                      ? `${featured.categoryLabel} à ${featured.city}. Consulte les détails et réserve ta place.`
                      : "Les événements publiés apparaîtront ici dès leur mise en ligne.")}
                </p>

                {featured ? (
                  <p className={styles.meta}>
                    <span>
                      <CalendarDays aria-hidden="true" />
                      {featuredDate ? `${DATE.format(featuredDate)} · ${TIME.format(featuredDate)}` : "Date à confirmer"}
                    </span>
                    <span>
                      <MapPin aria-hidden="true" />
                      {featured.venueName || featured.city}
                    </span>
                  </p>
                ) : null}

                <div className={styles.actions}>
                  <Link href={ROUTES.explore} className={styles.cta}>
                    Explorer les événements
                    <ArrowRight aria-hidden="true" />
                  </Link>
                  {featured ? (
                    <Link href={`/evenements/${featured.slug}`} className={styles.ghost}>
                      {priceLabel(featured)}
                    </Link>
                  ) : null}
                </div>

                <dl className={styles.stats}>
                  <div>
                    <dt>{total > 0 ? total : stats.events}</dt>
                    <dd>Événements</dd>
                  </div>
                  <div>
                    <dt>{stats.organizers}</dt>
                    <dd>Organisateurs</dd>
                  </div>
                  <div>
                    <dt>{stats.cities}</dt>
                    <dd>Villes</dd>
                  </div>
                </dl>
              </div>

              <div className={styles.visual}>
                <div className={styles.arch}>
                  {featured?.coverUrl ? (
                    <PublicStorageImage
                      src={featured.coverUrl}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 70vw, 34vw"
                      quality={88}
                      preload
                    />
                  ) : (
                    <span className={styles.archFallback} aria-hidden="true">
                      {featured?.categoryLabel ?? APP_NAME}
                    </span>
                  )}
                  <span className={styles.archGlow} aria-hidden="true" />
                </div>

                <p className={styles.visualNote}>
                  De bonnes
                  <br />
                  sorties,
                  <br />
                  ensemble.
                </p>

                <Link
                  href={featured ? `/evenements/${featured.slug}` : ROUTES.explore}
                  className={styles.roundLink}
                  aria-label={featured ? `Voir ${featured.title}` : "Voir les événements"}
                >
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>

              <div className={styles.rail}>
                {railItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={styles.railCard}
                  >
                    <span className={styles.railArt}>
                      {item.coverUrl ? (
                        <PublicStorageImage
                          src={item.coverUrl}
                          alt=""
                          fill
                          sizes="140px"
                          quality={65}
                        />
                      ) : (
                        <span className={styles.railFallbackArt} aria-hidden="true" />
                      )}
                    </span>
                    <span className={styles.railLabel}>
                      <span className={styles.railTitle} title={item.label}>
                        {item.label}
                      </span>
                      <ArrowRight className={styles.railArrow} aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <ul className={styles.swatches}>
          {PALETTE_SWATCHES.map((swatch) => (
            <li key={swatch.hex}>
              <Link
                href={swatch.href}
                className={styles.swatch}
                style={{
                  background: swatch.bg,
                  color: swatch.fg,
                  ...("border" in swatch && swatch.border ? { border: swatch.border } : {}),
                }}
              >
                <div className={styles.swatchTop}>
                  <span
                    className={styles.swatchHex}
                    style={{ background: swatch.badgeBg, color: swatch.badgeFg }}
                  >
                    {swatch.hex}
                  </span>
                  <ArrowUpRight className={styles.swatchArrow} aria-hidden="true" />
                </div>
                <div className={styles.swatchMeta}>
                  <p className={styles.swatchName}>{swatch.title}</p>
                  <p className={styles.swatchDesc}>{swatch.desc}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className={styles.footnote}>
          <span aria-hidden="true" />
          Billetterie mobile money · Salons de discussion · Check-in sur place
          <span aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
