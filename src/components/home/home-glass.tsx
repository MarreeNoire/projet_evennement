"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Headphones,
  MapPin,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  X,
  Zap,
} from "lucide-react";

import { BottomNav } from "@/components/layout/bottom-nav";
import type { HeaderUser } from "@/components/layout/header-types";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { EventCarousel } from "@/components/events/event-carousel";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { APP_NAME, ROUTES } from "@/lib/constants";
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
   Custom cursor
───────────────────────────────────────── */
function CinematicCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    const onMove = (e: PointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      smooth.current.x += (pos.current.x - smooth.current.x) * 0.14;
      smooth.current.y += (pos.current.y - smooth.current.y) * 0.14;
      cursor.style.transform = `translate(${smooth.current.x - 20}px, ${smooth.current.y - 20}px)`;
      dot.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    const onEnterHero = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (styles.cursorHero) cursor.classList.add(styles.cursorHero);
      const label = labelRef.current;
      if (label) {
        const price = target.dataset.price;
        label.textContent = price ? `${price}` : "Voir →";
      }
    };

    const onLeaveHero = () => {
      if (styles.cursorHero) cursor.classList.remove(styles.cursorHero);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    const heroImages = document.querySelectorAll("[data-cursor-hero]");
    heroImages.forEach((el) => {
      el.addEventListener("mouseenter", onEnterHero);
      el.addEventListener("mouseleave", onLeaveHero);
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(rafRef.current);
      heroImages.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterHero);
        el.removeEventListener("mouseleave", onLeaveHero);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className={styles.cursor} aria-hidden="true">
        <span ref={labelRef} className={styles.cursorLabel} />
      </div>
      <div ref={dotRef} className={styles.cursorDot} aria-hidden="true" />
    </>
  );
}

/* ─────────────────────────────────────────
   Parallax hero backdrop
───────────────────────────────────────── */
function HeroBackdrop({
  events,
  activeIndex,
}: {
  events: EditorialEvent[];
  activeIndex: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    if (isMobile) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      wrapper.style.transform = `scale(1.06) translate3d(${x}px, ${y}px, 0)`;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className={styles.heroBackdropContainer} aria-hidden="true">
      <div ref={wrapperRef} className={styles.heroBackdropInner}>
        {events.slice(0, 4).map((event, i) =>
          event.coverUrl ? (
            <div
              key={event.id}
              className={`${styles.heroSlide} ${i === activeIndex ? styles.heroSlideActive : ""} ${i === (activeIndex + 1) % Math.max(events.filter(e => e.coverUrl).length, 1) ? styles.heroSlideNext : ""}`}
            >
              <PublicStorageImage
                src={event.coverUrl}
                alt=""
                className={styles.heroBackdropImage}
                sizes="100vw"
                fill
                preload={i === 0}
              />
            </div>
          ) : null,
        )}
      </div>
      {/* Gradient overlays */}
      <div className={styles.heroOverlayLeft} />
      <div className={styles.heroOverlayBottom} />
      <div className={styles.heroOverlayTop} />
    </div>
  );
}

/* ─────────────────────────────────────────
   Dominant-color extraction → CTA glow
───────────────────────────────────────── */
function useDominantColor(coverUrl: string | null | undefined): string {
  const [color, setColor] = useState<string>("rgb(230, 57, 136)");

  useEffect(() => {
    if (!coverUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
          if (brightness > 40 && brightness < 220) {
            r += data[i]!;
            g += data[i + 1]!;
            b += data[i + 2]!;
            count++;
          }
        }
        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          // boost saturation
          const max = Math.max(r, g, b);
          const scale = Math.min(255 / max, 1.8);
          r = Math.min(255, Math.round(r * scale));
          g = Math.min(255, Math.round(g * scale));
          b = Math.min(255, Math.round(b * scale));
          setColor(`rgb(${r},${g},${b})`);
        }
      } catch {
        // silently fail
      }
    };
    img.src = coverUrl;
  }, [coverUrl]);

  return color;
}

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
        <span className={styles.dateBadge} aria-hidden="true"><strong>{DATE_DAY.format(new Date(event.startAt))}</strong><small>{DATE_MONTH.format(new Date(event.startAt)).replace(".", "")}</small></span>
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
            <CalendarDays aria-hidden="true" />{" "}
            {DATE.format(new Date(event.startAt))}
          </p>
          <p className={styles.eventPlace}>
            <MapPin aria-hidden="true" />{" "}
            {[event.venueName, event.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className={styles.cardFoot}>
          <strong>{eventPrice(event)}</strong>
          <button
            type="button"
            className={styles.reserveButton}
            onClick={() => onReserve(event)}
          >
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
export function HomeGlass({ events, viewer, stats, total }: HomeGlassProps) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [bookingEvent, setBookingEvent] = useState<EditorialEvent | null>(null);
  const [quantity, setQuantity] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const featuredEvents = useMemo(
    () =>
      events
        .filter((event) => event.coverUrl)
        .concat(events.filter((event) => !event.coverUrl)),
    [events],
  );
  const featured = featuredEvents[featuredIndex] ?? events[0] ?? null;

  const cities = useMemo(
    () => [...new Set(events.map((event) => event.city).filter(Boolean))].sort(),
    [events],
  );

  const now = new Date();
  const weekendStart = new Date(now);
  weekendStart.setDate(
    now.getDate() + (now.getDay() === 0 ? -1 : (6 - now.getDay() + 7) % 7),
  );
  weekendStart.setHours(0, 0, 0, 0);
  const weekendEnd = new Date(weekendStart);
  weekendEnd.setDate(weekendStart.getDate() + 2);
  const weekendEvents = events.filter((event) => {
    const date = new Date(event.startAt);
    return date >= weekendStart && date < weekendEnd;
  });

  const dominantColor = useDominantColor(featured?.coverUrl);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (bookingEvent && !dialog.open) dialog.showModal();
    if (!bookingEvent && dialog.open) dialog.close();
  }, [bookingEvent]);

  // Auto-advance hero every 6s
  useEffect(() => {
    if (featuredEvents.length < 2) return;
    const timer = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % featuredEvents.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredEvents.length]);

  function openBooking(event: EditorialEvent) {
    setQuantity(1);
    setBookingEvent(event);
  }

  function shiftFeature(direction: -1 | 1) {
    if (featuredEvents.length < 2) return;
    setFeaturedIndex(
      (index) => (index + direction + featuredEvents.length) % featuredEvents.length,
    );
  }

  const ctaStyle = {
    "--cta-glow": dominantColor,
    "--cta-glow-rgb": dominantColor,
  } as React.CSSProperties;

  return (
    <div className={styles.page}>
      <CinematicCursor />

      {/* ── HEADER ── */}
      <header className={styles.header} id="haut">
        <Link
          href={ROUTES.home}
          className={styles.brand}
          aria-label={`${APP_NAME} — Accueil`}
        >
          <span className={styles.brandMark}>E</span>
          <span>Event</span>
        </Link>
        <nav className={styles.nav} aria-label="Navigation principale">
          <Link href="#haut" aria-current="page">Accueil</Link>
          <Link href={ROUTES.explore}>Événements</Link>
          <Link href="#pourquoi">À propos</Link>
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

      <main>
        {/* ════════════════════════════════════════
            HERO — cinematic fullscreen
        ════════════════════════════════════════ */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <HeroBackdrop
            events={featuredEvents.filter((e) => e.coverUrl)}
            activeIndex={featuredIndex % Math.max(featuredEvents.filter((e) => e.coverUrl).length, 1)}
          />

          {/* Noise grain overlay */}
          <div className={styles.heroGrain} aria-hidden="true" />

          {/* Center content zone */}
          <div className={styles.heroCenter}>
            {/* Search bar — above title */}
            <form
              action={ROUTES.explore}
              className={styles.heroSearch}
              role="search"
              aria-label="Rechercher un événement"
            >
              <Search className={styles.heroSearchIcon} aria-hidden="true" />
              <label className={styles.srOnly} htmlFor="hero-q">
                Rechercher
              </label>
              <input
                id="hero-q"
                name="q"
                placeholder="Concert, festival, sport…"
                autoComplete="off"
              />
              <label className={styles.srOnly} htmlFor="hero-city">
                Ville
              </label>
              <div className={styles.heroSearchDivider} aria-hidden="true" />
              <MapPin className={styles.heroSearchCityIcon} aria-hidden="true" />
              <select id="hero-city" name="ville" defaultValue="">
                <option value="">Toutes les villes</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.heroSearchBtn} aria-label="Explorer">
                <Zap aria-hidden="true" />
              </button>
            </form>

            {/* Main title */}
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow} aria-hidden="true">
                <span className={styles.heroDot} />
                Billetterie en ligne premium
              </p>
              <h1 id="hero-title" className={styles.heroTitle}>
                Vivez les
                <br />
                <em>meilleurs</em>
                <br />
                <span className={styles.heroTitleAccent}>événements.</span>
              </h1>
              <p className={styles.heroLead}>
                Concerts, festivals, spectacles, sports… Réservez vos billets en quelques clics et vivez des expériences inoubliables.
              </p>

              <div className={styles.heroActions}>
                {/* CTA primary */}
                <Link
                  href={ROUTES.explore}
                  className={styles.ctaButton}
                  style={ctaStyle}
                >
                  <Sparkles aria-hidden="true" />
                  Réserver maintenant
                </Link>
                {/* CTA secondary */}
                <a href="#a-la-une" className={styles.ctaSecondary}>
                  <Play aria-hidden="true" /> Voir les événements
                </a>
              </div>

              {/* Social proof */}
              <div className={styles.socialProof}>
                <div className={styles.avatarStack}>
                  <i>E</i>
                  <i>+</i>
                  <i>✦</i>
                </div>
                <span>
                  <b>{formatNumber(total || stats.events)}</b> événements · {stats.cities} villes
                </span>
              </div>

            </div>
          </div>

          {/* Featured card — right side */}
          {featured ? (
            <aside className={styles.featuredPanel} aria-label="Événement à la une">
              <div
                className={styles.featuredPoster}
                data-cursor-hero
                data-price={eventPrice(featured)}
              >
                <Link href={eventHref(featured)} className={styles.featuredImageLink} aria-label={`Découvrir ${featured.title}`}>
                  <EventArtwork
                    event={featured}
                    className={styles.featuredImage}
                    sizes="(max-width: 760px) 78vw, 380px"
                  />
                </Link>
                <div className={styles.ticket3d} aria-hidden="true">
                  <div className={styles.ticket3dMain}>
                    <span className={styles.ticketLive}><i /> LIVE</span>
                    <h3>{featured.title}</h3>
                    <strong>{featured.categoryLabel}</strong>
                    <p><CalendarDays aria-hidden="true" /> {DATE.format(new Date(featured.startAt))}</p>
                    <p><MapPin aria-hidden="true" /> {[featured.venueName, featured.city].filter(Boolean).join(" · ")}</p>
                    <span className={styles.ticketEventBrand}>EVENT</span>
                  </div>
                  <div className={styles.ticket3dStub}>
                    <span className={styles.ticketVip}>VIP <small>PASS</small></span>
                    <span className={styles.barcode} />
                    <span className={styles.ticketStubMark}><Ticket aria-hidden="true" /></span>
                  </div>
                </div>
                <div className={styles.ticketPedestal} aria-hidden="true"><span /><i /></div>
                <span className={styles.featuredTag}>
                  <span />À LA UNE
                </span>
                <div className={styles.featuredPosterFoot}>
                  <span>{featured.categoryLabel}</span>
                  <span>{DATE.format(new Date(featured.startAt))}</span>
                </div>
              </div>
              <div className={styles.featuredInfo}>
                <div>
                  <p>LE MOMENT À NE PAS MANQUER</p>
                  <h2>
                    <Link href={eventHref(featured)}>{featured.title}</Link>
                  </h2>
                  <span>
                    <MapPin aria-hidden="true" />{" "}
                    {[featured.venueName, featured.city].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div className={styles.featuredBottom}>
                  <strong>{eventPrice(featured)}</strong>
                  <button
                    type="button"
                    style={ctaStyle}
                    className={styles.featuredReserveBtn}
                    onClick={() => openBooking(featured)}
                  >
                    Réserver <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              </div>
              {featuredEvents.length > 1 ? (
                <div className={styles.featureControls}>
                  <button
                    type="button"
                    onClick={() => shiftFeature(-1)}
                    aria-label="Événement précédent"
                  >
                    <ArrowLeft aria-hidden="true" />
                  </button>
                  <span>
                    {String(featuredIndex + 1).padStart(2, "0")}{" "}
                    <i>/</i>{" "}
                    {String(featuredEvents.length).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => shiftFeature(1)}
                    aria-label="Événement suivant"
                  >
                    <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </aside>
          ) : (
            <div className={styles.emptyFeature}>
              <Ticket aria-hidden="true" />
              <span>Les prochains événements arrivent bientôt.</span>
              <Link href={ROUTES.explore}>
                Explorer l'agenda <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* Scroll hint */}
          <a href="#a-la-une" className={styles.scrollHint}>
            <ChevronDown aria-hidden="true" />
            <span>Défiler</span>
          </a>
        </section>

        {/* ════════════════════════════════════════
            CATALOG — dark background
        ════════════════════════════════════════ */}
        <div className={styles.catalogBg}>
          {/* À LA UNE — grid */}
          <section id="a-la-une" className={styles.section} aria-labelledby="featured-title">
            <div className={styles.popularLayout}>
              <div className={styles.popularIntro}>
                <p className={styles.sectionEyebrow}>ÉVÉNEMENTS POPULAIRES</p>
                <h2 id="featured-title">Nos événements <em>incontournables.</em></h2>
                <p>Des soirées uniques, des artistes en vue et les rendez-vous qui font vibrer la ville.</p>
                <Link href={ROUTES.explore} className={styles.popularLink}>Voir tous les événements <ArrowRight aria-hidden="true" /></Link>
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

          {/* CE WEEK-END — carousel */}
          <section className={styles.weekendSection} aria-labelledby="weekend-title">
            <div className={`${styles.section} ${styles.weekendInner}`}>
              <div className={styles.sectionHead}>
                <div>
                  <p className={styles.sectionEyebrow}>
                    VOS PROCHAINES SORTIES <span>↗</span>
                  </p>
                  <h2 id="weekend-title">
                    Ce week-end, <em>on sort.</em>
                  </h2>
                  <p className={styles.sectionIntro}>
                    {weekendEvents.length
                      ? "Des événements programmés ce week-end."
                      : "Les prochaines dates à noter dans votre agenda."}
                  </p>
                </div>
                <Link href={ROUTES.explore} className={styles.sectionLink}>
                  Voir l'agenda <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
              {weekendEvents.length ? (
                <EventCarousel
                  label="Événements du week-end"
                  trackClassName={styles.weekendTrack}
                >
                  {weekendEvents.map((event) => (
                    <div key={event.id} className={styles.weekendItem}>
                      <EventCard event={event} onReserve={openBooking} />
                    </div>
                  ))}
                </EventCarousel>
              ) : (
                <div className={styles.weekendEmpty}>
                  <CalendarDays aria-hidden="true" />
                  <p>Pas encore de sortie annoncée pour ce week-end.</p>
                  <Link href={ROUTES.explore}>
                    Voir les prochaines dates <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section id="pourquoi" className={styles.whySection} aria-labelledby="why-title">
            <div className={styles.benefitGrid}>
              <article><Zap aria-hidden="true" /><strong>Réservation simple</strong><span>Votre place en quelques gestes.</span></article>
              <article><ShieldCheck aria-hidden="true" /><strong>Paiement sécurisé</strong><span>Mobile money ou carte bancaire.</span></article>
              <article><Headphones aria-hidden="true" /><strong>Votre événement, en lien</strong><span>Un salon pour échanger avant et après.</span></article>
              <article><Star aria-hidden="true" /><strong>Billets vérifiés</strong><span>Un QR code unique à présenter à l’entrée.</span></article>
            </div>
            <div className={styles.whyCopy}>
              <p>POURQUOI CHOISIR EVENT ?</p>
              <h2 id="why-title">Une billetterie <em>sans limites.</em></h2>
              <span>Plus qu’un billet, une porte ouverte sur les événements qui vous rassemblent.</span>
              <Link href="/aide">En savoir plus <ArrowRight aria-hidden="true" /></Link>
            </div>
          </section>

          <section className={styles.closingSection} aria-labelledby="closing-title">
            {featured?.coverUrl ? <div className={styles.closingPhoto}><PublicStorageImage src={featured.coverUrl} alt={`Ambiance de ${featured.title}`} sizes="(max-width: 760px) 100vw, 42vw" fill /></div> : null}
            <div className={styles.closingQuote}><span>“</span><p>Votre prochain grand souvenir commence par une place.</p><small>À vous de vivre l’instant.</small></div>
            <div className={styles.closingCopy}>
              <p>PRÊT À VIVRE L’EXPÉRIENCE ?</p>
              <h2 id="closing-title">Réservez <em>maintenant.</em></h2>
              <span>Ne manquez plus les événements qui font vibrer votre ville.</span>
              <Link href={ROUTES.explore}>Acheter mes billets <ArrowRight aria-hidden="true" /></Link>
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
                <span className={styles.categoryBadge}>
                  {bookingEvent.categoryLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setBookingEvent(null)}
                  aria-label="Fermer"
                >
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
                <span>
                  {bookingEvent.minPrice > 0 ? "À partir de" : "Tarif"}
                </span>
                <strong>
                  {bookingEvent.minPrice > 0
                    ? `${formatNumber(bookingEvent.minPrice * quantity)} FCFA`
                    : bookingEvent.maxPrice > 0
                      ? "Selon le billet choisi"
                      : "Gratuit"}
                </strong>
              </div>
              <p className={styles.estimateNote}>
                Le montant définitif dépend du type de billet choisi à l'étape suivante.
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
