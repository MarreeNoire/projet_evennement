"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Search, Sparkles, X } from "lucide-react";

import { BottomNav } from "@/components/layout/bottom-nav";
import type { HeaderUser } from "@/components/layout/header-types";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { EventCarousel } from "@/components/events/event-carousel";
import { FeaturesMarquee } from "@/components/home/features-marquee";
import { HeroCover } from "@/components/home/hero-cover";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { APP_NAME, ROUTES } from "@/lib/constants";
import {
  isStandaloneDisplay,
  serverStandaloneSnapshot,
  subscribeToStandalone,
} from "@/lib/pwa/standalone";
import { formatNumber } from "@/lib/utils";

import styles from "./home-glass.module.css";

export type EditorialEvent = {
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
  organizerName: string;
  organizerVerified: boolean;
};

type HomeGlassProps = {
  events: EditorialEvent[];
  viewer: HeaderUser | null;
  stats: { events: number; organizers: number; cities: number };
  total: number;
};

const DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Africa/Abidjan",
});
const DATE_DAY = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Africa/Abidjan" });
const DATE_MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Abidjan" });
const LONG_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Africa/Abidjan",
});

function eventPrice(event: EditorialEvent) {
  if (event.minPrice <= 0 && event.maxPrice <= 0) return "Gratuit";
  if (event.minPrice <= 0) return "Gratuit / payant";
  return `Dès ${formatNumber(event.minPrice)} FCFA`;
}

function eventHref(event: EditorialEvent) {
  return `/evenements/${event.slug}`;
}

function eventBookingHref(event: EditorialEvent, quantity: number) {
  return `/evenements/${event.slug}/billets?quantite=${quantity}`;
}

function EventArtwork({
  event,
  className,
  sizes,
}: {
  event: EditorialEvent;
  className: string | undefined;
  sizes: string;
}) {
  return event.coverUrl ? (
    <PublicStorageImage
      src={event.coverUrl}
      alt={`Affiche de ${event.title}`}
      className={className}
      sizes={sizes}
      fill
    />
  ) : (
    <div
      className={`${className} ${styles.artFallback}`}
      aria-label={`Aucune affiche disponible pour ${event.title}`}
    >
      <Sparkles aria-hidden="true" />
      <span>{event.categoryLabel}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Dominant-color extraction → CTA glow
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   Event card (catalog)
───────────────────────────────────────── */
function EventCard({
  event,
  onReserve,
  index = 0,
}: {
  event: EditorialEvent;
  onReserve: (event: EditorialEvent) => void;
  index?: number;
}) {
  const cardRef = useRef<HTMLElement>(null);

  // 3D tilt on hover
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    if (isMobile) return;

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) translateY(-6px) scale(1.02)`;
    };
    const onLeave = () => {
      card.style.transform = "";
    };

    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Intersection observer for stagger entrance
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          card.style.animationDelay = `${index * 100}ms`;
          if (styles.cardVisible) card.classList.add(styles.cardVisible);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [index]);

  return (
    <article ref={cardRef} className={styles.eventCard}>
      <Link
        href={eventHref(event)}
        className={styles.poster}
        aria-label={`Voir ${event.title}`}
        data-cursor-hero
        data-price={eventPrice(event)}
      >
        <EventArtwork
          event={event}
          className={styles.posterImage}
          sizes="(max-width: 700px) 86vw, (max-width: 1100px) 42vw, 31vw"
        />
        <span className={styles.dateBadge} aria-hidden="true">
          <strong>{DATE_DAY.format(new Date(event.startAt))}</strong>
          <small>{DATE_MONTH.format(new Date(event.startAt)).replace(".", "")}</small>
        </span>
        <span className={styles.categoryBadge}>{event.categoryLabel}</span>
        <span className={styles.posterArrow}>
          <ArrowUpRight aria-hidden="true" />
        </span>
      </Link>
      <div className={styles.eventDetails}>
        <div className={styles.eventHeading}>
          <h3>
            <Link href={eventHref(event)}>{event.title}</Link>
          </h3>
          <p className={styles.eventDate}>
            <CalendarDays aria-hidden="true" /> {DATE.format(new Date(event.startAt))}
          </p>
          <p className={styles.eventPlace}>
            <MapPin aria-hidden="true" />{" "}
            {[event.venueName, event.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className={styles.cardFoot}>
          <strong>{eventPrice(event)}</strong>
          <button type="button" className={styles.reserveButton} onClick={() => onReserve(event)}>
            Réserver <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
export function HomeGlass({ events, viewer }: HomeGlassProps) {
  const [bookingEvent, setBookingEvent] = useState<EditorialEvent | null>(null);
  const [quantity, setQuantity] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);

  /* Version installée (PWA) : l'accueil s'ouvre directement sur le contenu,
     sans hero ni navbar. La version web n'est pas concernée. Le rendu serveur
     renvoie `false`, le CSS masque déjà les blocs avant l'hydratation. */
  const isPwa = useSyncExternalStore(
    subscribeToStandalone,
    isStandaloneDisplay,
    serverStandaloneSnapshot,
  );

  /* Événement mis en avant dans la section de clôture : la première affiche disponible. */
  const featured = events.find((event) => event.coverUrl) ?? null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (bookingEvent && !dialog.open) dialog.showModal();
    if (!bookingEvent && dialog.open) dialog.close();
  }, [bookingEvent]);

  function openBooking(event: EditorialEvent) {
    setQuantity(1);
    setBookingEvent(event);
  }

  return (
    <div className={styles.page}>
      {/* ── HEADER (absent de la version installée) ── */}
      {isPwa ? null : (
        <header className={styles.header} id="haut">
          <Link href={ROUTES.home} className={styles.brand} aria-label={`${APP_NAME} — Accueil`}>
            <span className={styles.brandMark}>E</span>
            <span>Event</span>
          </Link>
          <nav className={styles.nav} aria-label="Navigation principale">
            <Link href="#haut" aria-current="page">
              Accueil
            </Link>
            <Link href={ROUTES.explore}>Événements</Link>
            <Link href="/aide">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <form action={ROUTES.explore} className={styles.quickSearch} role="search">
            <Search aria-hidden="true" />
            <label className={styles.srOnly} htmlFor="quick-search">
              Rechercher un événement
            </label>
            <input id="quick-search" name="q" placeholder="Rechercher…" />
            <button type="submit" aria-label="Lancer la recherche">
              <ArrowRight aria-hidden="true" />
            </button>
          </form>
          <div className={styles.accountActions}>
            {viewer ? (
              <Link href={ROUTES.myTickets} className={styles.loginButton}>
                Mes billets
              </Link>
            ) : (
              <Link href={ROUTES.login} className={styles.loginButton}>
                Connexion
              </Link>
            )}
            <Link href="/devenir-organisateur" className={styles.organizerButton}>
              Organiser <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </header>
      )}

      <main>
        {/* ════════════════════════════════════════
            HERO — cinematic fullscreen (absent de la PWA)
        ════════════════════════════════════════ */}
        {isPwa ? null : <HeroCover events={events} />}

        {/* ════════════════════════════════════════
            CATALOG — dark background
        ════════════════════════════════════════ */}
        <div className={styles.catalogBg}>
          {/* À LA UNE — grid */}
          <section id="a-la-une" className={styles.section} aria-labelledby="featured-title">
            <div className={styles.popularLayout}>
              <div className={styles.popularIntro}>
                <p className={styles.sectionEyebrow}>ÉVÉNEMENTS POPULAIRES</p>
                <h2 id="featured-title">
                  Nos événements <em>incontournables.</em>
                </h2>
                <p>
                  Des soirées uniques, des artistes en vue et les rendez-vous qui font vibrer la
                  ville.
                </p>
                <Link href={ROUTES.explore} className={styles.popularLink}>
                  Voir tous les événements <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              {events.length ? (
                <EventCarousel label="Événements populaires" trackClassName={styles.featuredGrid}>
                  {events.slice(0, 8).map((event, index) => (
                    <EventCard key={event.id} event={event} onReserve={openBooking} index={index} />
                  ))}
                </EventCarousel>
              ) : (
                <div className={styles.noEvents}>
                  <Sparkles aria-hidden="true" />
                  <h3>Le programme se prépare.</h3>
                  <p>Les événements publiés apparaîtront ici dès leur mise en ligne.</p>
                </div>
              )}
            </div>
          </section>

          {/* FIL DES SORTIES — marquees verticales à défilement opposé (absent de la PWA) */}
          {isPwa ? null : events.length ? <FeaturesMarquee events={events} /> : null}

          <section className={styles.closingSection} aria-labelledby="closing-title">
            {featured?.coverUrl ? (
              <div className={styles.closingPhoto}>
                <PublicStorageImage
                  src={featured.coverUrl}
                  alt={`Ambiance de ${featured.title}`}
                  sizes="(max-width: 760px) 100vw, 42vw"
                  fill
                />
              </div>
            ) : null}
            <div className={styles.closingQuote}>
              <span>“</span>
              <p>Votre prochain grand souvenir commence par une place.</p>
              <small>À vous de vivre l’instant.</small>
            </div>
            <div className={styles.closingCopy}>
              <p>PRÊT À VIVRE L’EXPÉRIENCE ?</p>
              <h2 id="closing-title">
                Réservez <em>maintenant.</em>
              </h2>
              <span>Ne manquez plus les événements qui font vibrer votre ville.</span>
              <Link href={ROUTES.explore}>
                Acheter mes billets <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <Link href={ROUTES.home} className={styles.brand}>
          <span className={styles.brandMark}>E</span>
          <span>Event</span>
        </Link>
        <p>Les bons moments se partagent.</p>
        <nav aria-label="Liens de pied de page">
          <Link href={ROUTES.explore}>Explorer</Link>
          <Link href={ROUTES.myTickets}>Mes billets</Link>
          <Link href="/aide">Aide</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <small>© {new Date().getFullYear()} Event · Abidjan</small>
      </footer>

      <PwaInstallPrompt />
      <BottomNav user={viewer} />

      {/* BOOKING MODAL */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="booking-title"
        onCancel={(event) => {
          event.preventDefault();
          setBookingEvent(null);
        }}
        onClose={() => setBookingEvent(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setBookingEvent(null);
        }}
      >
        {bookingEvent ? (
          <div className={styles.bookingModal}>
            <div className={styles.modalImage}>
              <EventArtwork
                event={bookingEvent}
                className={styles.modalImageInner}
                sizes="(max-width: 700px) 100vw, 38vw"
              />
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalTop}>
                <span className={styles.categoryBadge}>{bookingEvent.categoryLabel}</span>
                <button type="button" onClick={() => setBookingEvent(null)} aria-label="Fermer">
                  <X aria-hidden="true" />
                </button>
              </div>
              <p className={styles.sectionEyebrow}>VOTRE PROCHAINE SORTIE</p>
              <h2 id="booking-title">{bookingEvent.title}</h2>
              <p className={styles.modalMeta}>
                <CalendarDays aria-hidden="true" />{" "}
                {LONG_DATE.format(new Date(bookingEvent.startAt))}
              </p>
              <p className={styles.modalMeta}>
                <MapPin aria-hidden="true" />{" "}
                {[bookingEvent.venueName, bookingEvent.city].filter(Boolean).join(" · ")}
              </p>
              <label className={styles.quantityLabel} htmlFor="ticket-quantity">
                Nombre de billets
              </label>
              <div className={styles.quantityControl}>
                <button
                  type="button"
                  aria-label="Retirer un billet"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                >
                  −
                </button>
                <output id="ticket-quantity" aria-live="polite">
                  {quantity}
                </output>
                <button
                  type="button"
                  aria-label="Ajouter un billet"
                  onClick={() => setQuantity((v) => Math.min(10, v + 1))}
                >
                  +
                </button>
              </div>
              <div className={styles.modalTotal}>
                <span>{bookingEvent.minPrice > 0 ? "À partir de" : "Tarif"}</span>
                <strong>
                  {bookingEvent.minPrice > 0
                    ? `${formatNumber(bookingEvent.minPrice * quantity)} FCFA`
                    : bookingEvent.maxPrice > 0
                      ? "Selon le billet choisi"
                      : "Gratuit"}
                </strong>
              </div>
              <p className={styles.estimateNote}>
                Le montant définitif dépend du type de billet choisi à l’étape suivante.
              </p>
              <Link
                href={eventBookingHref(bookingEvent, quantity)}
                onClick={() => setBookingEvent(null)}
                className={styles.modalContinue}
              >
                Choisir mes billets <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
