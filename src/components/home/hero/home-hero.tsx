"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { APP_NAME, ROUTES } from "@/lib/constants";

import styles from "./home-hero.module.css";

export type HomeHeroEvent = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverUrl: string | null;
  categoryLabel: string;
  venueName: string | null;
  city: string;
  startAt: string;
  minPrice: number;
};

type HomeHeroProps = {
  events: HomeHeroEvent[];
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

export function HomeHero({ events, total }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();
  const featured = events[0] ?? null;
  const featuredDate = featured ? safeDate(featured.startAt) : null;
  const eventCount = new Intl.NumberFormat("fr-FR").format(total);

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
              <dt>{total > 0 ? eventCount : "Bientôt"}</dt>
              <dd>{total > 0 ? "événements à découvrir" : "de nouvelles sorties"}</dd>
            </div>
          </motion.dl>
        </motion.div>

        <motion.div
          className={styles.visual}
          initial={reduceMotion ? false : { opacity: 0, transform: "translateY(18px) scale(0.98)" }}
          animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
          transition={{
            duration: 0.72,
            delay: 0.12,
            ease: [0.23, 1, 0.32, 1] as const,
          }}
        >
          <div className={styles.arch}>
            {featured?.coverUrl ? (
              <PublicStorageImage
                src={featured.coverUrl}
                alt=""
                fill
                sizes="(max-width: 760px) 84vw, (max-width: 1100px) 48vw, 42vw"
                quality={84}
                preload
              />
            ) : (
              <div className={styles.archFallback} aria-hidden="true">
                <span>{featured?.categoryLabel ?? APP_NAME}</span>
              </div>
            )}
            <div className={styles.imageVeil} aria-hidden="true" />
            <p className={styles.imageLabel}>
              <span>ABIDJAN</span>
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
              {featured?.title ?? "Les prochaines sorties"}
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
                <span>Les événements publiés apparaîtront ici.</span>
              )}
            </span>
            <span className={styles.featureArrow} aria-hidden="true">
              <ArrowUpRight />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
