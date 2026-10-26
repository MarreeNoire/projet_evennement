"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Pause,
  Plus,
  Play,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  Sun,
  Ticket,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { useTheme } from "@/components/providers/app-providers";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import type { HeaderUser } from "@/components/layout/header-types";
import { PublicStorageImage } from "@/components/ui/public-storage-image";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatNumber, getInitials } from "@/lib/utils";

import styles from "./home-editorial.module.css";

/* =============================================================================
   ACCUEIL EDITORIAL
   --------------------------------------------------------------------------
   La direction artistique validée, appliquée à de vraies données publiées.
   Aucun événement, tarif, avis ou message inventé : les cartes, le poster, le
   billet d'exemple et le tableau de bord reprennent uniquement les fiches
   chargées côté serveur. Les panneaux d'interface sont explicitement signalés.
   ========================================================================== */

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

type SalonPhase = "avant" | "pendant" | "apres";

const TIME_ZONE = "Africa/Abidjan";

const MAIN_NAV = [
  { label: "Explorer", href: ROUTES.explore },
  { label: "Mes billets", href: ROUTES.myTickets },
  { label: "Mes salons", href: ROUTES.mySalons },
  { label: "Organiser", href: "/devenir-organisateur" },
];

const SHORT_WEEKDAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  timeZone: TIME_ZONE,
});
const DAY = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: TIME_ZONE });
const SHORT_MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TIME_ZONE });
const LONG_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});
const TIME = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});
const YEAR = new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: TIME_ZONE });

function cx(...names: Array<string | false | null | undefined>) {
  return names
    .filter(Boolean)
    .map((name) => styles[name as string])
    .join(" ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      weekday: "",
      day: "--",
      month: "",
      longDate: "Date à confirmer",
      time: "",
      year: "",
    };
  }

  return {
    weekday: SHORT_WEEKDAY.format(date).replace(".", ""),
    day: DAY.format(date),
    month: SHORT_MONTH.format(date).replace(".", ""),
    longDate: capitalize(LONG_DATE.format(date)),
    time: TIME.format(date),
    year: YEAR.format(date),
  };
}

function priceParts(event: Pick<EditorialEvent, "minPrice" | "maxPrice">) {
  if (event.minPrice <= 0 && event.maxPrice <= 0) {
    return { label: "Tarif", value: "Gratuit" };
  }
  if (event.minPrice === event.maxPrice) {
    return { label: "Tarif", value: `${formatNumber(event.minPrice)} FCFA` };
  }
  return { label: "Dès", value: `${formatNumber(event.minPrice)} FCFA` };
}

function artVariant(category: string) {
  switch (category) {
    case "concerts":
    case "festivals":
    case "humour":
      return "art-jazz";
    case "culture":
    case "mode":
    case "gastronomie":
      return "art-marche";
    case "formations":
    case "conferences":
    case "technologie":
    case "entreprises":
    case "etudiants":
      return "art-atelier";
    default:
      return "art-rencontre";
  }
}

type SalonPhaseDefinition = {
  id: SalonPhase;
  label: string;
  features: Array<{ icon: LucideIcon; title: string; text: string }>;
};

const SALON_PHASES: SalonPhaseDefinition[] = [
  {
    id: "avant",
    label: "Avant",
    features: [
      {
        icon: Users,
        title: "Se retrouver",
        text: "Covoiturage, point de rencontre et questions pratiques.",
      },
      {
        icon: Ticket,
        title: "Tout garder au même endroit",
        text: "Billets, informations et consignes de l'organisateur.",
      },
    ],
  },
  {
    id: "pendant",
    label: "Pendant",
    features: [
      {
        icon: MessageCircle,
        title: "Suivre le moment",
        text: "Le programme en direct et les nouvelles du lieu.",
      },
      {
        icon: CalendarDays,
        title: "Partager sur place",
        text: "Les photos et les temps forts de la soirée.",
      },
    ],
  },
  {
    id: "apres",
    label: "Après",
    features: [
      {
        icon: Users,
        title: "Rester en lien",
        text: "Retrouver les personnes rencontrées et garder le contact.",
      },
      {
        icon: CheckCircle2,
        title: "Garder les souvenirs",
        text: "L'album et les échanges restent accessibles dans le salon.",
      },
    ],
  },
];

/* ------------------------------- QR décoratif ------------------------------ */

type QrRect = { x: number; y: number; width: number; height: number; fill: string };

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildQr(seed: string): QrRect[] {
  const size = 21;
  const cell = 4;
  const reserved = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const rects: QrRect[] = [];
  const ink = "#22231f";
  const paper = "#fbf9f4";

  const reserve = (x: number, y: number, width: number, height: number) => {
    for (let row = y; row < y + height; row += 1) {
      for (let column = x; column < x + width; column += 1) {
        reserved[row]![column] = true;
      }
    }
  };

  reserve(0, 0, 7, 7);
  reserve(size - 7, 0, 7, 7);
  reserve(0, size - 7, 7, 7);
  for (let index = 8; index < size - 8; index += 1) {
    reserved[6]![index] = true;
    reserved[index]![6] = true;
  }

  let state = hashSeed(seed) || 20261107;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (!reserved[row]![column] && random() > 0.52) {
        rects.push({ x: column * cell, y: row * cell, width: cell, height: cell, fill: ink });
      }
    }
  }

  for (let index = 8; index < size - 8; index += 2) {
    rects.push({ x: index * cell, y: 6 * cell, width: cell, height: cell, fill: ink });
    rects.push({ x: 6 * cell, y: index * cell, width: cell, height: cell, fill: ink });
  }

  const finder = (x: number, y: number) => {
    rects.push({ x: x * cell, y: y * cell, width: 7 * cell, height: 7 * cell, fill: ink });
    rects.push({
      x: (x + 1) * cell,
      y: (y + 1) * cell,
      width: 5 * cell,
      height: 5 * cell,
      fill: paper,
    });
    rects.push({
      x: (x + 2) * cell,
      y: (y + 2) * cell,
      width: 3 * cell,
      height: 3 * cell,
      fill: ink,
    });
  };

  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);

  return rects;
}

function QrArt({ seed }: { seed: string }) {
  const rects = useMemo(() => buildQr(seed), [seed]);

  return (
    <svg viewBox="0 0 84 84" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      {rects.map((rect, index) => (
        <rect key={index} {...rect} />
      ))}
    </svg>
  );
}

/* --------------------------------- Briques --------------------------------- */

function Brand() {
  return (
    <>
      <span className={cx("brand-mark")} aria-hidden="true">
        e
      </span>
      <span className={cx("brand-word")}>event</span>
      <span className={cx("brand-dot")} aria-hidden="true" />
    </>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={cx("icon-btn", "theme-btn")}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className={cx("icon", "icon-sun")} aria-hidden="true" />
      <Moon className={cx("icon", "icon-moon")} aria-hidden="true" />
    </button>
  );
}

/* ============================ Menu du compte ============================== */

function AccountMenu({ viewer }: { viewer: HeaderUser }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      await createSupabaseBrowserClient().auth.signOut();
    }
    setOpen(false);
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <div ref={containerRef} className={cx("account")}>
      <button
        ref={buttonRef}
        type="button"
        className={cx("account-btn")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={cx("account-avatar")} aria-hidden="true">
          {viewer.avatarUrl ? (
            <PublicStorageImage
              src={viewer.avatarUrl}
              alt=""
              width={32}
              height={32}
              sizes="32px"
            />
          ) : (
            <span>{getInitials(viewer.displayName)}</span>
          )}
        </span>
        <span className={cx("account-name")}>{viewer.displayName}</span>
        <ChevronDown className={cx("icon", "account-chevron")} aria-hidden="true" />
        <span className="sr-only">Ouvrir le menu du compte</span>
      </button>

      {open ? (
        <div className={cx("account-menu")} role="menu">
          <div className={cx("account-meta")}>
            <p>{viewer.displayName}</p>
            {viewer.username ? <p>@{viewer.username}</p> : null}
          </div>

          <div className={cx("account-links")}>
            <Link role="menuitem" href={ROUTES.profile} onClick={() => setOpen(false)}>
              Mon profil
            </Link>
            <Link role="menuitem" href={ROUTES.myTickets} onClick={() => setOpen(false)}>
              Mes billets
            </Link>
            <Link role="menuitem" href={ROUTES.settings} onClick={() => setOpen(false)}>
              Réglages
            </Link>
            <Link role="menuitem" href={ROUTES.orgDashboard} onClick={() => setOpen(false)}>
              {viewer.isOrganizer ? "Espace organisateur" : "Devenir organisateur"}
            </Link>
            {viewer.isAdmin ? (
              <Link role="menuitem" href={ROUTES.admin} onClick={() => setOpen(false)}>
                Administration
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            role="menuitem"
            className={cx("account-signout")}
            onClick={handleSignOut}
          >
            <LogOut className={cx("icon")} aria-hidden="true" />
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ================================ Composant ================================ */

export function HomeEditorial({
  events,
  viewer,
}: {
  events: EditorialEvent[];
  viewer: HeaderUser | null;
}) {
  const featured = events[0] ?? null;
  const mainNav = MAIN_NAV.map((item) => {
    if (item.href === ROUTES.myTickets || item.href === ROUTES.mySalons) {
      return { ...item, href: viewer ? item.href : `${ROUTES.login}?redirect=${item.href}` };
    }
    return item;
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const heroTrackRef = useRef<HTMLDivElement>(null);
  const heroPinRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [heroScrollRange, setHeroScrollRange] = useState<[number, number]>([0, 1]);
  const heroProgress = useTransform(scrollY, heroScrollRange, [0, 1], { clamp: true });
  const backdropScale = useTransform(heroProgress, [0, 1], [1.02, 1.12]);
  const backdropY = useTransform(heroProgress, [0, 1], [0, -8]);
  const cueOpacity = useTransform(heroProgress, [0, 0.28], [1, 0]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroAutoplayPaused, setHeroAutoplayPaused] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("tout");
  const [salonPhase, setSalonPhase] = useState<SalonPhase>("avant");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const event of events) {
      if (!seen.has(event.category)) seen.set(event.category, event.categoryLabel);
    }
    return Array.from(seen, ([slug, label]) => ({ slug, label })).slice(0, 4);
  }, [events]);

  const visibleCount =
    activeCategory === "tout"
      ? events.length
      : events.filter((event) => event.category === activeCategory).length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const hero = heroPinRef.current;
    if (!hero) return;
    if (!("IntersectionObserver" in window)) {
      setIsHeroVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setIsHeroVisible(entry?.isIntersecting ?? false), { threshold: 0.1 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (events.length < 2 || heroAutoplayPaused || !isPageVisible || !isHeroVisible) return;

    const timeout = window.setTimeout(() => {
      setActiveHeroIndex((current) => (current + 1) % events.length);
    }, 7600);

    return () => window.clearTimeout(timeout);
  }, [activeHeroIndex, events.length, heroAutoplayPaused, isPageVisible, isHeroVisible]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!("IntersectionObserver" in window)) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!targets.length) return;

    const revealClass = styles.reveal;
    const revealInClass = styles["is-in"];
    if (!revealClass || !revealInClass) return;

    targets.forEach((target) => {
      target.classList.add(revealClass);
      if (target.dataset.reveal === "card") {
        const siblings = Array.from(target.parentElement?.children ?? []);
        target.style.setProperty("--rd", `${siblings.indexOf(target) * 55}ms`);
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(revealInClass);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = heroTrackRef.current;
    const pin = heroPinRef.current;
    if (!track || !pin) return;

    const updateScrollRange = () => {
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const pinStyle = window.getComputedStyle(pin);
      const stickyTop = pinStyle.position === "sticky" ? Number.parseFloat(pinStyle.top) || 0 : 0;
      const travel = Math.max(0, track.offsetHeight - pin.offsetHeight);
      const start = trackTop - stickyTop;
      const end = start + Math.max(1, travel);

      setHeroScrollRange((previous) =>
        Math.abs(previous[0] - start) < 1 && Math.abs(previous[1] - end) < 1
          ? previous
          : [start, end],
      );
    };

    updateScrollRange();
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateScrollRange);
    observer?.observe(track);
    observer?.observe(pin);
    const welcome = rootRef.current?.querySelector(`.${styles.welcome}`);
    if (welcome) observer?.observe(welcome);
    window.addEventListener("resize", updateScrollRange, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateScrollRange);
    };
  }, []);

  const selectSalonTab = (phase: SalonPhase, moveFocus: boolean) => {
    setSalonPhase(phase);
    if (moveFocus) {
      const index = ["avant", "pendant", "apres"].indexOf(phase);
      tabRefs.current[index]?.focus();
    }
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const phases: SalonPhase[] = ["avant", "pendant", "apres"];
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % phases.length;
    if (event.key === "ArrowLeft") next = (index - 1 + phases.length) % phases.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = phases.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const nextPhase = phases[next];
    if (!nextPhase) return;
    selectSalonTab(nextPhase, true);
  };

  const featuredDate = featured ? dateParts(featured.startAt) : null;
  const featuredPrice = featured ? priceParts(featured) : null;
  const heroIndex = events.length ? activeHeroIndex % events.length : 0;
  const heroEvent = events[heroIndex] ?? null;
  const nextHeroEvent = events.length > 1 ? events[(heroIndex + 1) % events.length] ?? null : null;
  const heroDate = heroEvent ? dateParts(heroEvent.startAt) : null;
  const heroPrice = heroEvent ? priceParts(heroEvent) : null;
  const currentYear = new Date().getFullYear();

  const moveHero = (direction: -1 | 1) => {
    if (events.length < 2) return;
    setActiveHeroIndex((current) => (current + direction + events.length) % events.length);
  };

  return (
    <div ref={rootRef} className={cx("home")}>
      <div className={cx("grain")} aria-hidden="true" />

      <header className={cx("site-head", scrolled && "is-scrolled")} id="haut">
        <div className={cx("wrap", "head-inner")}>
          <Link href="/" className={cx("brand")} aria-label={`${APP_NAME} — Accueil`}>
            <Brand />
          </Link>

          <nav className={cx("main-nav")} aria-label="Navigation principale">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={cx("head-actions")}>
            <Link href={ROUTES.explore} className={cx("icon-btn", "search-btn")} aria-label="Rechercher un événement">
              <Search className={cx("icon")} aria-hidden="true" />
            </Link>
            {viewer ? (
              <AccountMenu viewer={viewer} />
            ) : (
              <Link href={ROUTES.login} className={cx("head-login")}>
                Connexion
              </Link>
            )}
            <Link
              href="/devenir-organisateur"
              className={cx("btn", "btn-outline", "btn-sm")}
            >
              Publier un événemen
            </Link>
            <ThemeButton />
          </div>
        </div>
      </header>

      <main id="accueil-contenu">
        <div className={cx("content")}>
          <motion.section
            className={cx("welcome")}
            aria-labelledby="welcome-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.72, ease: [0.23, 1, 0.32, 1] }}
          >
            <div>
              <p className={cx("city-date")}>
                <span className={cx("city-dot")} aria-hidden="true" />
                {heroDate
                  ? `${heroDate.weekday} ${heroDate.day} ${heroDate.month} · Abidjan`
                  : "Abidjan · Côte d’Ivoire"}
              </p>
              <h1 id="welcome-title" className={cx("welcome-title")}>
                La ville se passe <span>dehors.</span>
              </h1>
            </div>
            <p className={cx("welcome-note")}>
              <strong>Ta prochaine sortie commence ici.</strong>
              Découvre les événements à venir, puis retrouve les participants dans leur salon.
            </p>
          </motion.section>

          <div ref={heroTrackRef} className={cx("hero-track")}>
            <div ref={heroPinRef} className={cx("hero-pin")}>
              <article className={cx("feature")} id="billets" aria-label="Événement à la une" aria-roledescription="carrousel">
                <motion.div
                  className={cx("feature-image")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.82, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
                >
                  <motion.div
                    className={cx("feature-image-backdrop")}
                    style={{ scale: backdropScale, y: backdropY }}
                  >
                    <AnimatePresence initial={false} mode="sync">
                      <motion.div key={heroEvent?.id ?? "empty-hero"} className={cx("hero-image-slide")} initial={{ opacity: 0, scale: 1.045 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}>
                        {heroEvent?.coverUrl ? <PublicStorageImage src={heroEvent.coverUrl} alt="" fill sizes="(max-width: 700px) calc(100vw - 34px), (max-width: 980px) 60vw, 68vw" quality={90} preload={heroIndex === 0} loading="eager" className={cx("hero-cover-image")} /> : null}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                  {isHeroVisible && nextHeroEvent?.coverUrl ? <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}><PublicStorageImage src={nextHeroEvent.coverUrl} alt="" fill sizes="(max-width: 700px) calc(100vw - 34px), (max-width: 980px) 60vw, 68vw" quality={90} loading="eager" /></div> : null}
                  <motion.span className={cx("scene-number")} style={{ opacity: cueOpacity }} aria-hidden="true">
                    {heroDate?.day || "01"}
                  </motion.span>
                  <div className={cx("image-topline")}>
                    <span className={cx("live-dot")} aria-hidden="true" />
                    La sélection Event
                  </div>
                  {events.length > 1 ? <div className={cx("hero-carousel-controls")} aria-label="Navigation des événements">
                    <button type="button" onClick={() => moveHero(-1)} aria-label="Événement précédent"><ChevronLeft className={cx("icon")} aria-hidden="true" /></button>
                    <span aria-live="polite" aria-atomic="true">{String(heroIndex + 1).padStart(2, "0")} <i>/</i> {String(events.length).padStart(2, "0")}</span>
                    <button type="button" onClick={() => setHeroAutoplayPaused((paused) => !paused)} aria-label={heroAutoplayPaused ? "Reprendre le défilement automatique" : "Mettre en pause le défilement automatique"}>{heroAutoplayPaused ? <Play className={cx("icon")} aria-hidden="true" /> : <Pause className={cx("icon")} aria-hidden="true" />}</button>
                    <button type="button" onClick={() => moveHero(1)} aria-label="Événement suivant"><ChevronRight className={cx("icon")} aria-hidden="true" /></button>
                  </div> : null}
                  <div className={cx("image-caption")}>
                    <span className={cx("genre")}>
                      {heroEvent
                        ? `${heroEvent.categoryLabel} · ${heroEvent.city}`.toUpperCase()
                        : "SORTIES · ABIDJAN"}
                    </span>
                    <h2>Une sortie qui mérite le détour.</h2>
                  </div>
                  <motion.span className={cx("hero-scroll-cue")} style={{ opacity: cueOpacity }} aria-hidden="true">
                    <span>Fais défiler pour découvrir</span>
                    <i />
                  </motion.span>
                </motion.div>

                <div className={cx("feature-info")}><AnimatePresence mode="wait" initial={false}><motion.div key={heroEvent?.id ?? "empty-hero-info"} className={cx("feature-info-content")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}>
                  <div className={cx("feature-date")}>
                    <span className={cx("date-block")}>
                      <b>{heroDate?.day || "À"}</b>
                      <span>{heroDate?.month || "VEN"}</span>
                    </span>
                    <span className={cx("feature-location")}>
                      <span>{heroDate?.time || "À venir"}</span>
                      <span>
                        <MapPin className={cx("icon")} aria-hidden="true" />
                        {heroEvent?.venueName || heroEvent?.city || "Abidjan"}
                      </span>
                    </span>
                  </div>
                  <div className={cx("feature-details")}>
                    <p className={cx("eyebrow")}>Sélection du moment</p>
                    <h3>{heroEvent?.title || "Les prochaines sorties"}</h3>
                    <p>
                      {heroEvent?.summary ||
                        (heroEvent
                          ? `${heroEvent.categoryLabel} à ${heroEvent.city}. Consulte les détails et réserve ta place.`
                          : "Les événements publiés apparaîtront ici dès leur mise en ligne.")}
                    </p>
                  </div>
                  <div className={cx("feature-foot")}>
                    <span className={cx("price")}>
                      {heroPrice?.label || "Programme"}
                      <strong>{heroPrice?.value || "À découvrir"}</strong>
                    </span>
                    <Link
                      className={cx("cta")}
                      href={heroEvent ? `/evenements/${heroEvent.slug}` : ROUTES.explore}
                    >
                      Voir l’événement
                      <ArrowUpRight className={cx("icon")} aria-hidden="true" />
                    </Link>
                  </div>
                </motion.div></AnimatePresence></div>
              </article>
              <div className={cx("hero-progress")} aria-hidden="true">
                <motion.span style={{ scaleX: heroProgress }} />
              </div>
            </div>
          </div>
        </div>

        <section className={cx("quick-access", "wrap")} aria-labelledby="quick-access-title">
          <div className={cx("quick-access-heading")}>
            <p className={cx("eyebrow")}><b>Accès direct</b></p>
            <h2 id="quick-access-title">Où veux-tu aller ?</h2>
          </div>
          <nav className={cx("quick-access-links")} aria-label="Accès rapides">
            <Link href={ROUTES.explore} className={cx("quick-link", "quick-link-primary")}>
              <CalendarDays className={cx("icon")} aria-hidden="true" />
              <span><strong>Trouver un événement</strong><small>Dates, lieux et catégories</small></span>
              <ArrowRight className={cx("icon", "quick-arrow")} aria-hidden="true" />
            </Link>
            <Link href={viewer ? ROUTES.myTickets : ROUTES.login} className={cx("quick-link")}>
              <Ticket className={cx("icon")} aria-hidden="true" />
              <span><strong>Mes billets</strong><small>{viewer ? "Retrouver mes réservations" : "Se connecter pour les retrouver"}</small></span>
              <ArrowRight className={cx("icon", "quick-arrow")} aria-hidden="true" />
            </Link>
            <Link href={viewer ? ROUTES.mySalons : ROUTES.login} className={cx("quick-link")}>
              <MessageCircle className={cx("icon")} aria-hidden="true" />
              <span><strong>Mes salons</strong><small>{viewer ? "Rejoindre les conversations" : "Se connecter pour participer"}</small></span>
              <ArrowRight className={cx("icon", "quick-arrow")} aria-hidden="true" />
            </Link>
            <Link href={viewer?.isOrganizer ? ROUTES.orgDashboard : "/devenir-organisateur"} className={cx("quick-link")}>
              <Users className={cx("icon")} aria-hidden="true" />
              <span><strong>{viewer?.isOrganizer ? "Espace organisateur" : "Organiser un événement"}</strong><small>Créer et gérer une sortie</small></span>
              <ArrowRight className={cx("icon", "quick-arrow")} aria-hidden="true" />
            </Link>
          </nav>
          <PwaInstallPrompt />
        </section>

        <section className={cx("capabilities")} aria-label="Ce que permet Event">
          <div className={cx("wrap", "caps")}>
            <div className={cx("cap")} data-reveal>
              <Ticket className={cx("icon")} aria-hidden="true" />
              <div>
                <strong>Billets avec QR code</strong>
                <span>Un billet numérique vérifié à l&apos;entrée.</span>
              </div>
            </div>
            <div className={cx("cap")} data-reveal>
              <MessageCircle className={cx("icon")} aria-hidden="true" />
              <div>
                <strong>Un salon par événement</strong>
                <span>Les échanges continuent avant et après.</span>
              </div>
            </div>
            <div className={cx("cap")} data-reveal>
              <MapPin className={cx("icon")} aria-hidden="true" />
              <div>
                <strong>Paiement en FCFA</strong>
                <span>Mobile money ou carte, selon les options proposées.</span>
              </div>
            </div>
            <div className={cx("cap")} data-reveal>
              <ShieldCheck className={cx("icon")} aria-hidden="true" />
              <div>
                <strong>Espace organisateur</strong>
                <span>Publication, participants et accès au même endroit.</span>
              </div>
            </div>
          </div>
        </section>

        <section className={cx("section", "wrap")} id="decouvrir" aria-labelledby="decouvrir-title">
          <div className={cx("section-head")} data-reveal>
            <div>
              <p className={cx("eyebrow")}>
                <b>01</b> Découvrir
              </p>
              <h2 id="decouvrir-title">Ce qui se prépare à Abidjan.</h2>
            </div>
            <div className={cx("head-side")}>
              <p>
                Une sélection de sorties publiées par leurs organisateurs. Dates, lieux et tarifs
                viennent de leurs fiches.
              </p>
              <Link href={ROUTES.explore} className={cx("link-arrow")}>
                Tout le programme
                <ArrowRight className={cx("icon")} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {events.length > 0 ? (
            <>
              {categories.length > 1 ? (
                <div className={cx("filters")}>
                  <div
                    className={cx("filter-list")}
                    role="group"
                    aria-label="Filtrer les événements par catégorie"
                  >
                    <button
                      type="button"
                      className={cx("filter")}
                      aria-pressed={activeCategory === "tout"}
                      onClick={() => setActiveCategory("tout")}
                    >
                      Tou
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.slug}
                        type="button"
                        className={cx("filter")}
                        aria-pressed={activeCategory === category.slug}
                        onClick={() => setActiveCategory(category.slug)}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                  <p className={cx("filter-count")} aria-live="polite">
                    {visibleCount} {visibleCount > 1 ? "sorties affichées" : "sortie affichée"}
                  </p>
                </div>
              ) : null}

              <div className={cx("events")}>
                {events.map((event, index) => {
                  const date = dateParts(event.startAt);
                  const price = priceParts(event);
                  const hidden =
                    activeCategory !== "tout" && event.category !== activeCategory;

                  return (
                    <article
                      key={event.id}
                      className={cx("event-card")}
                      data-reveal="card"
                      hidden={hidden}
                    >
                      <Link href={`/evenements/${event.slug}`} className={cx("card-link")}>
                        <div
                          className={cx(
                            "card-art",
                            artVariant(event.category),
                            event.coverUrl && "has-cover",
                          )}
                        >
                          {event.coverUrl ? (
                            <div className={cx("card-cover")}>
                              <PublicStorageImage
                                src={event.coverUrl}
                                alt=""
                                fill
                                sizes="(max-width: 620px) 116px, (max-width: 1100px) 45vw, 300px"
                              />
                            </div>
                          ) : (
                            <div className={cx("art-fill")} aria-hidden="true" />
                          )}
                          <div className={cx("art-inner")}>
                            <div className={cx("art-top")}>
                              <span className={cx("art-tag")}>{event.categoryLabel}</span>
                              <span className={cx("art-num")}>
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                            {!event.coverUrl ? (
                              <div className={cx("art-word")}>
                                {event.categoryLabel.split(" ")[0]}
                                <em>{event.title}</em>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className={cx("card-body")}>
                          <div className={cx("card-date")}>
                            <span className={cx("dow")}>{date.weekday}</span>
                            <strong>{date.day}</strong>
                            <span className={cx("month")}>{date.month}</span>
                          </div>
                          <div className={cx("card-main")}>
                            <h3>{event.title}</h3>
                            <p>{[event.venueName, event.city].filter(Boolean).join(" · ")}</p>
                          </div>
                          <div className={cx("card-side")}>
                            <p className={cx("card-price")}>
                              <span>{price.label}</span>
                              {price.value}
                            </p>
                            <span className={cx("card-go")}>
                              <ArrowUpRight className={cx("icon")} aria-hidden="true" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={cx("empty-state")} data-reveal>
              <p className={cx("eyebrow")}>
                <b>01</b> Découvrir
              </p>
              <h3>Aucune sortie publiée pour le moment.</h3>
              <p>
                Les prochains événements apparaîtront ici dès leur publication par un organisateur.
              </p>
              <Link href="/devenir-organisateur" className={cx("btn", "btn-primary")}>
                Publier un événemen
                <ArrowRight className={cx("icon")} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>

        <section className={cx("salon-band")} id="salons" aria-labelledby="salon-title">
          <div className={cx("wrap", "salon-grid")}>
            <div className={cx("salon-copy")} data-reveal>
              <p className={cx("eyebrow")}>
                <b>02</b> Les salons
              </p>
              <h2 id="salon-title">Le fil ne se coupe pas à la sortie.</h2>
              <p className={cx("lead")}>
                Chaque événement a son salon. Les participants s&apos;y organisent avant la date,
                partagent ce qui se passe sur place et gardent le contact après la dernière
                chanson.
              </p>
              <ul className={cx("phase-list")}>
                <li className={cx("phase")}>
                  <span>AVANT</span>
                  <div>
                    <strong>Se donner rendez-vous</strong>
                    <p>Covoiturage, dernière question pratique, heure et point de rencontre.</p>
                  </div>
                </li>
                <li className={cx("phase")}>
                  <span>PENDANT</span>
                  <div>
                    <strong>Suivre le moment ensemble</strong>
                    <p>Le programme en direct et les photos prises sur place.</p>
                  </div>
                </li>
                <li className={cx("phase")}>
                  <span>APRÈS</span>
                  <div>
                    <strong>Rester en lien</strong>
                    <p>
                      Retrouver les photos, prolonger la discussion et garder les contacts utiles.
                    </p>
                  </div>
                </li>
              </ul>
              <Link
                href={featured ? `/evenements/${featured.slug}/salon` : ROUTES.explore}
                className={cx("link-arrow")}
              >
                Voir un salon en contexte
                <ArrowRight className={cx("icon")} aria-hidden="true" />
              </Link>
            </div>

            <div className={cx("salon-ui")} data-reveal>
              <div className={cx("salon-head")}>
                <div>
                  <p className={cx("salon-title")}>Salon · {featured?.title || "Aperçu"}</p>
                  <p className={cx("salon-status")}>
                    <span className={cx("live-dot")} aria-hidden="true" />
                    Aperçu de l&apos;interface
                  </p>
                </div>
                <div className={cx("salon-tabs")} role="tablist" aria-label="Moment du salon">
                  {SALON_PHASES.map((phase, index) => (
                    <button
                      key={phase.id}
                      ref={(element) => {
                        tabRefs.current[index] = element;
                      }}
                      type="button"
                      role="tab"
                      id={`salon-tab-${phase.id}`}
                      aria-selected={salonPhase === phase.id}
                      aria-controls={`salon-panel-${phase.id}`}
                      tabIndex={salonPhase === phase.id ? 0 : -1}
                      className={cx("salon-tab")}
                      onClick={() => selectSalonTab(phase.id, false)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>
              </div>

              {SALON_PHASES.map((phase) => (
                <div
                  key={phase.id}
                  className={cx("salon-panel")}
                  role="tabpanel"
                  id={`salon-panel-${phase.id}`}
                  aria-labelledby={`salon-tab-${phase.id}`}
                  tabIndex={0}
                  hidden={salonPhase !== phase.id}
                >
                  {phase.features.map(({ icon: Icon, title, text }) => (
                    <div key={title} className={cx("salon-feature")}>
                      <span className={cx("salon-feature-icon")} aria-hidden="true">
                        <Icon className={cx("icon")} />
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <p>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className={cx("composer")} aria-hidden="true">
                <span>Écrire dans le salon</span>
                <button type="button" tabIndex={-1}>
                  <Send className={cx("icon")} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className={cx("section", "wrap", "ticket-section")}
          id="billets"
          aria-labelledby="billets-title"
        >
          <div className={cx("ticket-copy")} data-reveal>
            <p className={cx("eyebrow")}>
              <b>03</b> Billetterie
            </p>
            <h2 id="billets-title">Ta place, en trois gestes.</h2>
            <p className={cx("lead")}>
              Le parcours reste court et lisible : le prix, les conditions et les moyens de
              paiement sont annoncés avant de valider la commande.
            </p>
            <ol className={cx("steps")}>
              <li className={cx("step")}>
                <span className={cx("step-num")} aria-hidden="true">
                  01
                </span>
                <div>
                  <h3>Choisis ton événement</h3>
                  <p>Date, lieu, tarif et conditions figurent sur la fiche publiée.</p>
                </div>
              </li>
              <li className={cx("step")}>
                <span className={cx("step-num")} aria-hidden="true">
                  02
                </span>
                <div>
                  <h3>Paie en FCFA</h3>
                  <p>Mobile money ou carte, selon les options proposées pour cette sortie.</p>
                </div>
              </li>
              <li className={cx("step")}>
                <span className={cx("step-num")} aria-hidden="true">
                  03
                </span>
                <div>
                  <h3>Présente ton billet</h3>
                  <p>
                    Le QR code est vérifié à l&apos;entrée. Ton billet reste accessible depuis ton
                    compte.
                  </p>
                </div>
              </li>
            </ol>
            <p className={cx("hero-note", "ticket-note")}>
              <ShieldCheck className={cx("icon")} aria-hidden="true" />
              <span>
                <strong>Un accès par personne.</strong> Le contrôle d&apos;accès évite les doubles
                entrées.
              </span>
            </p>
          </div>

          <div className={cx("ticket-stage")} data-reveal>
            <div className={cx("ticket-shadow")} aria-hidden="true" />
            <article className={cx("ticket")} aria-label="Exemple de billet">
              <div className={cx("ticket-main")}>
                <p className={cx("ticket-brand")}>event</p>
                <p className={cx("ticket-kicker")}>Exemple de billet · Admission générale</p>
                <h3 className={cx("ticket-title")}>
                  {featured?.title || "Votre prochain événement"}
                </h3>
                <dl className={cx("ticket-dl")}>
                  <div>
                    <dt>Date</dt>
                    <dd>
                      {featuredDate
                        ? `${featuredDate.longDate} ${featuredDate.year}`
                        : "À venir"}
                    </dd>
                  </div>
                  <div>
                    <dt>Heure</dt>
                    <dd>{featuredDate?.time || "À confirmer"}</dd>
                  </div>
                  <div>
                    <dt>Lieu</dt>
                    <dd>{featured?.venueName || "À confirmer"}</dd>
                  </div>
                  <div>
                    <dt>Ville</dt>
                    <dd>{featured?.city || "Abidjan"}</dd>
                  </div>
                </dl>
                <div className={cx("ticket-foot")}>
                  <p className={cx("ticket-price")}>
                    <small>Tarif</small>
                    {featuredPrice ? featuredPrice.value : "—"}
                  </p>
                  <p className={cx("ticket-ref")}>
                    Billet nominatif
                    <br />1 personne
                  </p>
                </div>
              </div>
              <div className={cx("ticket-stub")}>
                <div>
                  <div className={cx("ticket-qr")}>
                    <QrArt seed={`ticket-${featured?.slug || "event"}`} />
                  </div>
                  <p className={cx("ticket-scan")}>
                    Aperçu
                    <br />
                    non scannable
                  </p>
                </div>
                <p className={cx("ticket-price")}>
                  {featured && featured.minPrice > 0 ? (
                    <>
                      {formatNumber(featured.minPrice)}
                      <small>FCFA</small>
                    </>
                  ) : featured ? (
                    "Gratuit"
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <span className={cx("ticket-stamp")} aria-hidden="true">
                Even
                <br />
                Bille
                <br />
                {featuredDate?.year || currentYear}
              </span>
            </article>

            <Link
              href={featured ? `/evenements/${featured.slug}/billets` : ROUTES.explore}
              className={cx("link-arrow", "ticket-link")}
            >
              {featured ? "Voir les billets de cet événement" : "Trouver un événement"}
              <ArrowRight className={cx("icon")} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className={cx("organizer")} id="organiser" aria-labelledby="organiser-title">
          <div className={cx("wrap", "organizer-inner")}>
            <div data-reveal>
              <p className={cx("eyebrow")}>
                <b>04</b> Organiser
              </p>
              <h2 id="organiser-title">Organise sans perdre le fil.</h2>
              <p className={cx("lead")}>
                Publie ton événement, suis les participants et contrôle les accès depuis le même
                espace. Les informations affichées restent celles de ta fiche.
              </p>
              <ul className={cx("org-list")}>
                <li className={cx("org-item")}>
                  <CalendarDays className={cx("icon")} aria-hidden="true" />
                  <div>
                    <strong>Publication</strong>
                    <span>Une fiche claire, une couverture, des tarifs et des conditions.</span>
                  </div>
                </li>
                <li className={cx("org-item")}>
                  <Ticket className={cx("icon")} aria-hidden="true" />
                  <div>
                    <strong>Billetterie</strong>
                    <span>Les commandes et les billets émis, au même endroit.</span>
                  </div>
                </li>
                <li className={cx("org-item")}>
                  <QrCode className={cx("icon")} aria-hidden="true" />
                  <div>
                    <strong>Contrôle d&apos;accès</strong>
                    <span>Scanne les billets à l&apos;entrée et suis les validations.</span>
                  </div>
                </li>
                <li className={cx("org-item")}>
                  <Users className={cx("icon")} aria-hidden="true" />
                  <div>
                    <strong>Équipe</strong>
                    <span>Donne les bons accès aux personnes qui t&apos;accompagnent.</span>
                  </div>
                </li>
              </ul>
              <p className={cx("preview-note")}>
                Aperçu de l&apos;interface · les titres repris sont ceux des événements publiés.
              </p>
              <Link href="/devenir-organisateur" className={cx("btn", "btn-light")}>
                Devenir organisateur
                <ArrowRight className={cx("icon")} aria-hidden="true" />
              </Link>
            </div>

            <div className={cx("dash")} aria-hidden="true">
              <div className={cx("dash-top")}>
                <div className={cx("dash-brand")}>
                  <span className={cx("brand-mark")}>e</span>
                  <p>Espace organisateur · Aperçu</p>
                </div>
                <span className={cx("dash-avatar")}>e</span>
              </div>
              <div className={cx("dash-body")}>
                <div className={cx("dash-nav")}>
                  <span className={cx("is-active")}>
                    <CalendarDays className={cx("icon")} />
                    Événements
                  </span>
                  <span>
                    <Users className={cx("icon")} />
                    Participants
                  </span>
                  <span>
                    <QrCode className={cx("icon")} />
                    Contrôle d&apos;accès
                  </span>
                  <span>
                    <ShieldCheck className={cx("icon")} />
                    Équipe
                  </span>
                </div>
                <div className={cx("dash-main")}>
                  <div className={cx("dash-head")}>
                    <h3>Mes événements</h3>
                    <span className={cx("dash-publish")}>
                      <Plus className={cx("icon")} />
                      Publier
                    </span>
                  </div>

                  {events.slice(0, 3).map((event) => {
                    const date = dateParts(event.startAt);
                    return (
                      <div key={event.id} className={cx("dash-row")}>
                        <div className={cx("dash-row-title")}>
                          <strong>{event.title}</strong>
                          <span>
                            {date.weekday} {date.day} {date.month} ·{" "}
                            {event.venueName || event.city}
                          </span>
                        </div>
                        <span className={cx("status", "status-live")}>Publié</span>
                        <ArrowRight className={cx("icon")} />
                      </div>
                    );
                  })}

                  {events.length === 0 ? (
                    <div className={cx("dash-row")}>
                      <div className={cx("dash-row-title")}>
                        <strong>Aucun événement publié</strong>
                        <span>Publie ta première sortie</span>
                      </div>
                      <span className={cx("status", "status-draft")}>—</span>
                      <ArrowRight className={cx("icon")} />
                    </div>
                  ) : null}

                  <div className={cx("dash-toast")}>
                    <span className={cx("check")}>
                      <Check className={cx("icon")} />
                    </span>
                    <div>
                      <strong>Contrôle d&apos;accès</strong>
                      <small>Billets vérifiés à l&apos;entrée</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={cx("closing")} id="rejoindre" aria-labelledby="rejoindre-title">
          <div className={cx("wrap", "closing-inner")}>
            <div data-reveal>
              <p className={cx("eyebrow")}>
                <b>05</b> Rejoindre
              </p>
              <h2 id="rejoindre-title">
                Ta prochaine sortie a <em>déjà</em> son salon.
              </h2>
              <p>
                Découvre les événements publiés, réserve ta place et retrouve les participants
                avant, pendant et après la rencontre.
              </p>
            </div>
            <div className={cx("closing-cta")} data-reveal>
              <Link href={ROUTES.explore} className={cx("btn", "btn-primary")}>
                Découvrir les sorties
                <ArrowRight className={cx("icon")} aria-hidden="true" />
              </Link>
              <Link href="/devenir-organisateur" className={cx("link-arrow")}>
                Créer un événemen
                <ArrowUpRight className={cx("icon")} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={cx("site-foot")}>
        <div className={cx("wrap")}>
          <div className={cx("foot-grid")}>
            <div className={cx("foot-brand")}>
              <Link href="/" className={cx("brand")} aria-label={`${APP_NAME} — Accueil`}>
                <Brand />
              </Link>
              <p>
                La plateforme événementielle de Côte d&apos;Ivoire. Découvrir une sortie, réserver
                sa place et rester en lien avec les personnes rencontrées.
              </p>
            </div>
            <div className={cx("foot-col")}>
              <h3>Découvrir</h3>
              <Link href={ROUTES.explore}>Tous les événements</Link>
              <Link href="/organisateurs">Organisateurs</Link>
              <Link href="/aide">Centre d&apos;aide</Link>
              <Link href="/devenir-organisateur">Devenir organisateur</Link>
            </div>
            <div className={cx("foot-col")}>
              <h3>Organiser</h3>
              <Link href="/devenir-organisateur">Publier un événement</Link>
              <Link href={ROUTES.orgDashboard}>Espace organisateur</Link>
              <Link href="/aide">Billetterie</Link>
              <Link href="/contact">Nous contacter</Link>
            </div>
            <div className={cx("foot-col")}>
              <h3>Informations</h3>
              {viewer ? (
                <>
                  <Link href={ROUTES.profile}>Mon profil</Link>
                  <Link href={ROUTES.myTickets}>Mes billets</Link>
                  <Link href={ROUTES.settings}>Réglages</Link>
                </>
              ) : (
                <>
                  <Link href={ROUTES.login}>Connexion</Link>
                  <Link href={ROUTES.register}>Créer un compte</Link>
                </>
              )}
              <Link href="/cgu">Conditions</Link>
              <Link href="/confidentialite">Confidentialité</Link>
              <Link href="/mentions-legales">Mentions légales</Link>
            </div>
          </div>
          <div className={cx("foot-bottom")}>
            <p>© {currentYear} Event · Abidjan, Côte d&apos;Ivoire</p>
            <p className={cx("foot-note")}>
              Les événements affichés proviennent des fiches publiées par leurs organisateurs.
            </p>
            <a href="#haut">Retour en haut</a>
          </div>
        </div>
      </footer>

      {/* Même chrome mobile que les pages éditoriales : la barre d'onglets
          flotte au-dessus du pied de page, qui lui réserve sa hauteur. */}
      <BottomNav user={viewer} />
    </div>
  );
}
